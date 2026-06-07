import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactWebhookSettingsDto } from './contact-webhook.dto';

type ContactWebhookRuntimeConfig = {
  enabled: boolean;
  url: string | null;
  event: string;
  testEvent: string;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
};

@Injectable()
export class ContactWebhookService {
  private readonly logger = new Logger(ContactWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async status() {
    const config = await this.runtimeConfig();
    return {
      configured: Boolean(config.enabled && config.url),
      hasSecret: Boolean(this.webhookSecret),
      event: config.event,
      testEvent: config.testEvent,
      timeoutMs: config.timeoutMs,
      retryAttempts: config.retryAttempts,
      retryDelayMs: config.retryDelayMs,
    };
  }

  async settings() {
    const settings = await this.persistedSettings();
    const config = await this.runtimeConfig(settings);
    return {
      id: settings?.id,
      enabled: config.enabled,
      url: config.url,
      event: config.event,
      testEvent: config.testEvent,
      timeoutMs: config.timeoutMs,
      retryAttempts: config.retryAttempts,
      retryDelayMs: config.retryDelayMs,
      hasSecret: Boolean(this.webhookSecret),
      source: settings ? 'database' : 'environment',
    };
  }

  async updateSettings(dto: UpdateContactWebhookSettingsDto) {
    const existing = await this.persistedSettings();
    const data = {
      enabled: dto.enabled ?? existing?.enabled ?? false,
      url: this.optionalTrim(dto.url ?? existing?.url ?? null),
      event: dto.event?.trim() || existing?.event || 'contact.message.created',
      testEvent:
        dto.testEvent?.trim() || existing?.testEvent || 'contact.webhook.test',
      timeoutMs: dto.timeoutMs ?? existing?.timeoutMs ?? 5_000,
      retryAttempts: dto.retryAttempts ?? existing?.retryAttempts ?? 2,
      retryDelayMs: dto.retryDelayMs ?? existing?.retryDelayMs ?? 30_000,
      deletedAt: null,
    };
    const saved = existing
      ? await this.prisma.contactWebhookSetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.contactWebhookSetting.create({ data });
    return {
      id: saved.id,
      enabled: saved.enabled,
      url: saved.url,
      event: saved.event,
      testEvent: saved.testEvent,
      timeoutMs: saved.timeoutMs,
      retryAttempts: saved.retryAttempts,
      retryDelayMs: saved.retryDelayMs,
      hasSecret: Boolean(this.webhookSecret),
      source: 'database',
    };
  }

  async deliveries() {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'contact.webhook.delivery',
        resource: 'contact-webhook',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return logs.map((log) => {
      const metadata = this.metadataRecord(log.metadata);
      return {
        id: log.id,
        event: this.stringValue(metadata.event) || log.resourceId || 'unknown',
        configured: Boolean(metadata.configured),
        dispatched: Boolean(metadata.dispatched),
        status: this.numberValue(metadata.status),
        error: this.stringValue(metadata.error),
        messageId: this.stringValue(metadata.messageId),
        retryAttempt: this.numberValue(metadata.retryAttempt),
        createdAt: log.createdAt,
      };
    });
  }

  async dispatch(message: ContactMessage, retryAttempt = 0) {
    const config = await this.runtimeConfig();
    if (!config.enabled || !config.url) {
      return { dispatched: false };
    }

    const body = JSON.stringify({
      event: config.event,
      data: {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        status: message.status,
        createdAt: message.createdAt,
      },
    });

    const result = await this.postWebhook(
      config.url,
      body,
      config.event,
      {
        messageId: message.id,
        ...(retryAttempt ? { retryAttempt } : {}),
      },
      config.timeoutMs,
    );
    if (!result.dispatched) {
      this.scheduleRetry(message.id, retryAttempt + 1, config);
    }
    return result;
  }

  async testDispatch() {
    const config = await this.runtimeConfig();
    if (!config.enabled || !config.url) {
      await this.auditDelivery('contact.webhook.test', false, false);
      return { configured: false, dispatched: false };
    }

    const body = JSON.stringify({
      event: config.testEvent,
      data: {
        sentAt: new Date().toISOString(),
        source: 'portfolio-platform',
      },
    });

    const result = await this.postWebhook(
      config.url,
      body,
      config.testEvent,
      {},
      config.timeoutMs,
    );
    return { configured: true, ...result };
  }

  async retryMessage(messageId: string, retryAttempt = 0) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id: messageId },
    });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Contact message not found');
    }

    const result = await this.dispatch(message, retryAttempt);
    return { messageId, ...result };
  }

  private scheduleRetry(
    messageId: string,
    retryAttempt: number,
    config: ContactWebhookRuntimeConfig,
  ) {
    if (retryAttempt > config.retryAttempts) {
      return;
    }
    setTimeout(() => {
      void this.retryMessage(messageId, retryAttempt);
    }, config.retryDelayMs);
  }

  private async postWebhook(
    url: string,
    body: string,
    event: string,
    metadata: Record<string, unknown> = {},
    timeoutMs = 5_000,
  ) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers(body, event),
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        this.logger.warn(`Contact webhook returned ${response.status}`);
      }
      await this.auditDelivery(event, true, response.ok, {
        ...metadata,
        status: response.status,
      });
      return { dispatched: response.ok, status: response.status };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.warn(`Contact webhook unavailable: ${message}`);
      await this.auditDelivery(event, true, false, {
        ...metadata,
        error: message,
      });
      return { dispatched: false };
    }
  }

  private async auditDelivery(
    event: string,
    configured: boolean,
    dispatched: boolean,
    metadata: Record<string, unknown> = {},
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'contact.webhook.delivery',
          resource: 'contact-webhook',
          resourceId: event,
          metadata: {
            event,
            configured,
            dispatched,
            ...metadata,
          } as never,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Contact webhook audit failed: ${(error as Error).message}`,
      );
    }
  }

  private headers(body: string, event: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Portfolio-Event': event,
    };
    const secret = this.webhookSecret;
    if (secret) {
      headers['X-Portfolio-Signature'] = createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }
    return headers;
  }

  private async runtimeConfig(
    settings?: Awaited<ReturnType<ContactWebhookService['persistedSettings']>>,
  ): Promise<ContactWebhookRuntimeConfig> {
    const persisted = settings ?? (await this.persistedSettings());
    const envUrl =
      this.configService.get<string>('CONTACT_WEBHOOK_URL') || null;
    const url = persisted?.url || envUrl;
    return {
      enabled: persisted ? persisted.enabled : Boolean(envUrl),
      url,
      event: persisted?.event || 'contact.message.created',
      testEvent: persisted?.testEvent || 'contact.webhook.test',
      timeoutMs: this.numberValueInRange(
        persisted?.timeoutMs,
        5_000,
        1_000,
        30_000,
      ),
      retryAttempts: this.numberValueInRange(
        persisted?.retryAttempts,
        this.numberConfig('CONTACT_WEBHOOK_RETRY_ATTEMPTS', 2, 0, 5),
        0,
        5,
      ),
      retryDelayMs: this.numberValueInRange(
        persisted?.retryDelayMs,
        this.numberConfig(
          'CONTACT_WEBHOOK_RETRY_DELAY_MS',
          30_000,
          1_000,
          300_000,
        ),
        1_000,
        300_000,
      ),
    };
  }

  private persistedSettings() {
    return this.prisma.contactWebhookSetting.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private get webhookSecret() {
    return this.configService.get<string>('CONTACT_WEBHOOK_SECRET');
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

  private metadataRecord(metadata: unknown): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return {};
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value : null;
  }

  private numberValue(value: unknown) {
    return typeof value === 'number' ? value : null;
  }

  private numberValueInRange(
    value: number | null | undefined,
    fallback: number,
    minimum: number,
    maximum: number,
  ) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(Math.trunc(Number(value)), minimum), maximum);
  }

  private optionalTrim(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
