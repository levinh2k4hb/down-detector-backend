import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringSchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Monitoring Scheduler initialized');
    this.logger.log('⏰ Website health check will run every 10 seconds');
  }

  /**
   * Chạy mỗi 10 giây để kiểm tra tất cả websites
   */
  @Cron('*/10 * * * * *', {
    name: 'websiteHealthCheck',
  })
  async handleWebsiteHealthCheck() {
    // Prevent overlapping executions
    if (this.isRunning) {
      this.logger.debug('Previous health check still running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.debug('🔍 Starting scheduled website health check...');
      await this.monitoringService.checkAllWebsites();
      const duration = Date.now() - startTime;
      this.logger.debug(`✅ Health check completed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`❌ Health check failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Chạy mỗi phút để log thống kê
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'healthCheckStats',
  })
  async logHealthCheckStats() {
    this.logger.log('📊 Monitoring scheduler is running...');
  }

  /**
   * Pause scheduler
   */
  pauseScheduler() {
    try {
      const job = this.schedulerRegistry.getCronJob('websiteHealthCheck');
      job.stop();
      this.logger.warn('⏸️ Website health check scheduler paused');
    } catch (error) {
      this.logger.error('Error pausing scheduler:', error.message);
    }
  }

  /**
   * Resume scheduler
   */
  resumeScheduler() {
    try {
      const job = this.schedulerRegistry.getCronJob('websiteHealthCheck');
      job.start();
      this.logger.log('▶️ Website health check scheduler resumed');
    } catch (error) {
      this.logger.error('Error resuming scheduler:', error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): { isRunning: boolean; nextRun: Date | null; currentlyChecking: boolean } {
    try {
      const job = this.schedulerRegistry.getCronJob('websiteHealthCheck');
      const isJobRunning = job.lastDate() !== null;
      return {
        isRunning: isJobRunning,
        nextRun: job.nextDate()?.toJSDate() ?? null,
        currentlyChecking: this.isRunning,
      };
    } catch {
      return { isRunning: false, nextRun: null, currentlyChecking: false };
    }
  }
}