import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactWebhookService {
  private readonly logger = new Logger(ContactWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  status() {
    return {
      configured: Boolean(this.webhookUrl),
      hasSecret: Boolean(this.webhookSecret),
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5_000,
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
        createdAt: log.createdAt,
      };
    });
  }

  async dispatch(message: ContactMessage) {
    const url = this.webhookUrl;
    if (!url) {
      return { dispatched: false };
    }

    const body = JSON.stringify({
      event: 'contact.message.created',
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

    return this.postWebhook(url, body, 'contact.message.created', {
      messageId: message.id,
    });
  }

  async testDispatch() {
    const url = this.webhookUrl;
    if (!url) {
      await this.auditDelivery('contact.webhook.test', false, false);
      return { configured: false, dispatched: false };
    }

    const body = JSON.stringify({
      event: 'contact.webhook.test',
      data: {
        sentAt: new Date().toISOString(),
        source: 'portfolio-platform',
      },
    });

    const result = await this.postWebhook(url, body, 'contact.webhook.test');
    return { configured: true, ...result };
  }

  private async postWebhook(
    url: string,
    body: string,
    event: string,
    metadata: Record<string, unknown> = {},
  ) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers(body, event),
        body,
        signal: AbortSignal.timeout(5_000),
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

  private get webhookUrl() {
    return this.configService.get<string>('CONTACT_WEBHOOK_URL');
  }

  private get webhookSecret() {
    return this.configService.get<string>('CONTACT_WEBHOOK_SECRET');
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
}
