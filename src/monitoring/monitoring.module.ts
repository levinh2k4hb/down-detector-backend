import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringSchedulerService } from './monitoring-scheduler.service';
import { Website } from '../website/website.entity';
import { Admin } from '../admin/admin.entity';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Website, Admin]),
    ScheduleModule.forRoot(),
    PushNotificationModule
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringSchedulerService],
  exports: [MonitoringService, MonitoringSchedulerService],
})
export class MonitoringModule {}
