import { Controller, Post, Delete, Get, Body, Param, Headers } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';

@Controller('push-notifications')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Get('vapid-public-key')
  async getVapidPublicKey() {
    const publicKey = await this.pushNotificationService.getVapidPublicKey();
    return { publicKey };
  }

  @Post('subscribe')
  async subscribe(
    @Body() body: { adminId: number; subscription: any },
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.pushNotificationService.subscribe(
      body.adminId,
      body.subscription,
      userAgent,
    );
    return { success: true, subscriptionId: result.id };
  }

  @Delete('unsubscribe/:adminId')
  async unsubscribe(@Param('adminId') adminId: string) {
    await this.pushNotificationService.unsubscribe(parseInt(adminId));
    return { success: true };
  }

  @Post('test/:adminId')
  async sendTestNotification(
    @Param('adminId') adminId: string,
    @Body() body: { message?: string },
  ) {
    const success = await this.pushNotificationService.sendTestNotification(
      parseInt(adminId),
      body.message || 'Test notification from Down Detector',
    );
    return { success, message: success ? 'Test notification sent' : 'Failed to send notification' };
  }
}