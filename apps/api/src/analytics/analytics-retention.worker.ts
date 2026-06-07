import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsRetentionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsRetentionWorker.name);
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (
      this.configService.get<string>('ANALYTICS_RETENTION_WORKER_ENABLED') ===
      'false'
    ) {
      return;
    }
    if (!this.analyticsService.privacyStatus().retentionDays) {
      return;
    }
    const intervalMs = this.numberConfig(
      'ANALYTICS_RETENTION_WORKER_INTERVAL_MS',
      86_400_000,
      60_000,
      604_800_000,
    );
    this.interval = setInterval(() => {
      void this.pruneRetention();
    }, intervalMs);
    this.interval.unref?.();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private async pruneRetention() {
    try {
      const result = await this.analyticsService.pruneRetention();
      if (result.deleted > 0) {
        this.logger.log(`Pruned ${result.deleted} analytics events`);
      }
    } catch (error) {
      this.logger.warn(
        `Analytics retention worker failed: ${(error as Error).message}`,
      );
    }
  }

  private numberConfig(
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ) {
    const configured = Number(this.configService.get<string>(key) || fallback);
    if (!Number.isFinite(configured)) {
      return fallback;
    }
    return Math.min(Math.max(Math.trunc(configured), minimum), maximum);
  }
}
