import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRetentionWorker } from './analytics-retention.worker';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRetentionWorker],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
