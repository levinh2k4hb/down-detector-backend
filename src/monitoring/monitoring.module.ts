import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { Website } from '../website/website.entity';
import { Admin } from '../admin/admin.entity';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Website, Admin]),
    PushNotificationModule
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
