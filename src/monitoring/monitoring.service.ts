import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Website } from '../website/website.entity';
import { Admin } from '../admin/admin.entity';
import { PushNotificationService } from '../push-notification/push-notification.service';
import * as nodemailer from 'nodemailer';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';
import * as dns from 'dns';

const execAsync = promisify(exec);

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Website)
    private websiteRepository: Repository<Website>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private pushNotificationService: PushNotificationService,
  ) {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async checkWebsite(websiteId: number): Promise<{ isActive: boolean }> {
    const website = await this.websiteRepository.findOne({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error('Website not found');
    }

    const wasActive = website.isActive;
    const isActive = await this.checkUrl(website.domain);

    // Update website status
    website.isActive = isActive;
    website.lastChecked = new Date();
    await this.websiteRepository.save(website);

    // If website just went down, send notification
    if (wasActive && !isActive) {
      this.logger.warn(`Website down: ${website.domain}`);
      await this.sendDownNotification(website);
    } else if (!wasActive && isActive) {
      this.logger.log(`Website recovered: ${website.domain}`);
    }

    return { isActive };
  }

  async checkAllWebsites(): Promise<void> {
    const websites = await this.websiteRepository.find();
    this.logger.log(`Checking ${websites.length} websites...`);

    // Thêm kiểm tra parallel để tăng tốc
    const checkPromises = websites.map(async (website) => {
      try {
        await this.checkWebsite(website.id);
      } catch (error) {
        this.logger.error(
          `Error checking website ${website.id}: ${error.message}`,
        );
      }
    });

    await Promise.allSettled(checkPromises);
  }

  // Phương thức kiểm tra nhanh để phát hiện DNS errors
  async quickDNSCheck(url: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Kiểm tra DNS trước
      const dnsResult = await this.checkDNS(domain);
      if (!dnsResult) {
        return { isValid: false, error: 'DNS_PROBE_FINISHED_NXDOMAIN' };
      }

      // Kiểm tra nhanh với HTTP HEAD request
      const httpResult = await this.checkHttpWithNodeJS(url);
      if (!httpResult) {
        return { isValid: false, error: 'HTTP_CONNECTION_FAILED' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      // Chuẩn hóa URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Strategy 1: DNS Check với Node.js DNS module
      const dnsOk = await this.checkDNS(domain);
      if (!dnsOk) {
        this.logger.debug(`DNS check failed for ${domain}`);
        return false;
      }

      // Strategy 2: HTTP Check với Node.js HTTP module
      const httpOk = await this.checkHttpWithNodeJS(url);
      
      // Strategy 3: cURL Check (backup method)
      const curlOk = await this.checkWithCurl(url);
      
      // Strategy 4: Content validation
      const contentOk = await this.checkContent(url);

      // Website được coi là UP nếu:
      // - DNS OK và ít nhất 2/3 methods khác thành công
      const methods = [httpOk, curlOk, contentOk];
      const successCount = methods.filter(Boolean).length;
      
      this.logger.debug(
        `${url} - DNS: ${dnsOk}, HTTP: ${httpOk}, cURL: ${curlOk}, Content: ${contentOk}`
      );
      
      return dnsOk && successCount >= 2;

    } catch (error) {
      this.logger.error(`Error checking ${url}: ${error.message}`);
      return false;
    }
  }

  private async checkDNS(domain: string): Promise<boolean> {
    return new Promise((resolve) => {
      dns.lookup(domain, (err) => {
        if (err) {
          this.logger.debug(`DNS lookup failed for ${domain}: ${err.code}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async checkHttpWithNodeJS(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'DownDetector/1.0',
          'Accept': '*/*'
        },
        // Tắt certificate validation để tránh lỗi SSL
        rejectUnauthorized: false
      };

      const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
        const statusCode = res.statusCode || 0;
        this.logger.debug(`HTTP check ${url}: ${statusCode}`);
        
        // Kiểm tra redirect
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          try {
            const redirectDomain = new URL(res.headers.location, url).hostname;
            const originalDomain = urlObj.hostname.replace('www.', '');
            const redirectDomainClean = redirectDomain.replace('www.', '');
            
            // Nếu redirect sang domain khác hoàn toàn
            if (!redirectDomainClean.includes(originalDomain) && 
                !originalDomain.includes(redirectDomainClean)) {
              this.logger.debug(`Redirect to different domain: ${originalDomain} → ${redirectDomain}`);
              resolve(false);
              return;
            }
          } catch (e) {
            // Ignore URL parsing errors
          }
        }
        
        resolve(statusCode >= 200 && statusCode < 400);
      });

      req.on('error', (err: any) => {
        this.logger.debug(`HTTP request error for ${url}: ${err.code || err.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        this.logger.debug(`HTTP request timeout for ${url}`);
        req.destroy();
        resolve(false);
      });

      req.setTimeout(10000);
      req.end();
    });
  }

  private async checkWithCurl(url: string): Promise<boolean> {
    try {
      const curlCommand = process.platform === 'win32' 
        ? `curl.exe -I -L -s -S --connect-timeout 5 --max-time 10 --insecure "${url}"`
        : `curl -I -L -s -S --connect-timeout 5 --max-time 10 --insecure "${url}"`;

      const { stdout, stderr } = await execAsync(curlCommand);

      if (stderr) {
        const stderrLower = stderr.toLowerCase();
        if (
          stderrLower.includes('could not resolve host') ||
          stderrLower.includes('name or service not known') ||
          stderrLower.includes('connection refused') ||
          stderrLower.includes('operation timed out')
        ) {
          return false;
        }
      }

      if (!stdout || stdout.trim() === '') {
        return false;
      }

      const statusMatch = stdout.match(/HTTP\/[\d.]+\s+(\d+)/);
      if (!statusMatch) {
        return false;
      }

      const statusCode = parseInt(statusMatch[1], 10);
      return statusCode >= 200 && statusCode < 400;

    } catch (error) {
      return false;
    }
  }

  private async checkContent(url: string): Promise<boolean> {
    try {
      const curlCommand = process.platform === 'win32'
        ? `curl.exe -L -s --connect-timeout 5 --max-time 8 --insecure "${url}"`
        : `curl -L -s --connect-timeout 5 --max-time 8 --insecure "${url}"`;

      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr && (
        stderr.includes('Could not resolve host') ||
        stderr.includes('connection refused') ||
        stderr.includes('operation timed out')
      )) {
        return false;
      }

      if (!stdout || stdout.trim() === '') {
        return false;
      }

      const content = stdout.toLowerCase();
      
      // Kiểm tra các dấu hiệu của trang lỗi
      const errorSigns = [
        'dns_probe_finished_nxdomain',
        'dns error',
        'page not found',
        'domain for sale',
        'parked domain',
        'this domain may be for sale',
        'không thể truy cập trang web này',
        'kiểm tra xem có lỗi chính tả'
      ];

      if (errorSigns.some(sign => content.includes(sign))) {
        this.logger.debug(`Error page detected for ${url}`);
        return false;
      }

      // Kiểm tra có phải ISP redirect không
      if (content.includes('<title>') && (
        content.includes('search') || 
        content.includes('redirect') ||
        content.includes('not found')
      )) {
        // Có thể là trang redirect của ISP
        const titleMatch = content.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1].toLowerCase().includes('search')) {
          this.logger.debug(`ISP search page detected for ${url}`);
          return false;
        }
      }

      return true;
    } catch {
      return true; // Nếu không kiểm tra được content, không fail
    }
  }

  private async sendDownNotification(website: Website): Promise<void> {
    try {
      const admins = await this.adminRepository.find({
        where: { isActive: true },
      });

      if (admins.length === 0) {
        this.logger.warn('No active admins to notify');
        return;
      }

      // Send both email and push notifications concurrently
      const [emailResults, pushResult] = await Promise.allSettled([
        // Email notifications
        Promise.allSettled(admins.map((admin) => this.sendEmail(admin, website))),
        // Push notifications
        this.pushNotificationService.sendWebsiteDownNotification(website, admins),
      ]);

      this.logger.log(`Notifications sent for ${website.domain}: Email=${emailResults.status}, Push=${pushResult.status}`);
    } catch (error) {
      this.logger.error(`Error sending notifications: ${error.message}`);
    }
  }

  private async sendEmail(admin: Admin, website: Website): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: admin.email,
        subject: `🔴 Website Down Alert: ${website.domain}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">🔴 Website Down Alert</h2>
            <p>Xin chào <strong>${admin.name}</strong>,</p>
            <p>Website <strong>${website.domain}</strong> hiện đang không hoạt động.</p>
            <p><strong>Thời gian phát hiện:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              Vui lòng kiểm tra và xử lý sớm nhất có thể.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Trân trọng,<br>
              Hệ thống giám sát Down Detector
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${admin.email} for ${website.domain}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${admin.email}: ${error.message}`,
      );
    }
  }
}
