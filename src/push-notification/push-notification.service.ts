import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';
import { Admin } from '../admin/admin.entity';
import { Website } from '../website/website.entity';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
  ) {
    // Configure web-push
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:smartdashboard.vn@gmail.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }

  async subscribe(adminId: number, subscription: any, userAgent?: string): Promise<PushSubscription> {
    // Remove existing subscription for this admin if exists
    await this.pushSubscriptionRepository.delete({ adminId });

    const pushSub = this.pushSubscriptionRepository.create({
      adminId,
      subscription,
      endpoint: subscription.endpoint,
      userAgent,
    });

    return this.pushSubscriptionRepository.save(pushSub);
  }

  async unsubscribe(adminId: number): Promise<void> {
    await this.pushSubscriptionRepository.update(
      { adminId, isActive: true },
      { isActive: false }
    );
  }

  async sendWebsiteDownNotification(website: Website, admins: Admin[]): Promise<void> {
    const adminIds = admins.map(admin => admin.id);
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: {
        adminId: adminIds as any,
        isActive: true,
      },
      relations: ['admin'],
    });

    const payload = JSON.stringify({
      title: `🔴 Website Down: ${website.domain}`,
      body: `${website.domain} is not responding. Check immediately.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `website-down-${website.id}`,
      data: {
        websiteId: website.id,
        domain: website.domain,
        timestamp: new Date().toISOString(),
        action: 'website-down',
      },
      actions: [
        {
          action: 'check',
          title: 'Check Website',
          icon: '/icons/check-icon.png',
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view-icon.png',
        },
      ],
      requireInteraction: true,
      silent: false,
    });

    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        this.logger.log(`Push sent to admin ${sub.admin?.name || sub.adminId}`);
      } catch (error) {
        this.logger.error(`Failed to send push to admin ${sub.admin?.name || sub.adminId}: ${error.message}`);
        
        // If subscription is invalid, mark as inactive
        if (error.statusCode === 404 || error.statusCode === 410) {
          sub.isActive = false;
          await this.pushSubscriptionRepository.save(sub);
        }
      }
    });

    await Promise.allSettled(notificationPromises);
  }

  async sendTestNotification(adminId: number, message: string): Promise<boolean> {
    const subscription = await this.pushSubscriptionRepository.findOne({
      where: { adminId, isActive: true },
      relations: ['admin'],
    });

    if (!subscription) {
      throw new Error('No active subscription found for admin');
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: message || 'This is a test push notification from Down Detector',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification',
      data: {
        action: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    try {
      await webpush.sendNotification(subscription.subscription, payload);
      return true;
    } catch (error) {
      this.logger.error(`Test notification failed: ${error.message}`);
      return false;
    }
  }

  async getVapidPublicKey(): Promise<string> {
    return process.env.VAPID_PUBLIC_KEY!;
  }
}