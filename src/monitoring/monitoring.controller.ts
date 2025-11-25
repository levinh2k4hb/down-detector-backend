import { Controller, Post, Param, Get, Query, Body } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post('check/:id')
  async checkWebsite(@Param('id') id: string) {
    return this.monitoringService.checkWebsite(parseInt(id, 10));
  }

  @Post('check-all')
  async checkAllWebsites() {
    await this.monitoringService.checkAllWebsites();
    return { message: 'Checking all websites' };
  }

  @Get('quick-check')
  async quickCheck(@Query('url') url: string) {
    if (!url) {
      return { error: 'URL parameter is required' };
    }
    return this.monitoringService.quickDNSCheck(url);
  }

  @Post('test-email')
  async testEmail(@Body() body: { email: string; websiteDomain?: string }) {
    try {
      // Tạo admin test object
      const testAdmin = {
        id: 999,
        name: 'Test Admin',
        email: body.email,
        password: 'test',
        phoneNumber: '0123456789',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Tạo website test object  
      const testWebsite = {
        id: 999,
        domain: body.websiteDomain || 'test-website.com',
        isActive: false,
        lastChecked: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.monitoringService['sendEmail'](testAdmin, testWebsite);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
