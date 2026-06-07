import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactWebhookService } from './contact-webhook.service';

@Injectable()
export class ContactWebhookRetryWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContactWebhookRetryWorker.name);
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly configService: ConfigService,
    private readonly contactWebhookService: ContactWebhookService,
  ) {}

  onModuleInit() {
    if (
      this.configService.get<string>('CONTACT_WEBHOOK_RETRY_WORKER_ENABLED') ===
      'false'
    ) {
      return;
    }
    const intervalMs = this.numberConfig(
      'CONTACT_WEBHOOK_RETRY_WORKER_INTERVAL_MS',
      60_000,
      1_000,
      300_000,
    );
    this.interval = setInterval(() => {
      void this.processDueRetries();
    }, intervalMs);
    this.interval.unref?.();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private async processDueRetries() {
    try {
      const result = await this.contactWebhookService.processDueRetries();
      if (result.processed > 0) {
        this.logger.log(
          `Processed ${result.processed} contact webhook retries`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Contact webhook retry worker failed: ${(error as Error).message}`,
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
