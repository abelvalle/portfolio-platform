import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';
import { createHmac } from 'node:crypto';

@Injectable()
export class ContactWebhookService {
  private readonly logger = new Logger(ContactWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  status() {
    return {
      configured: Boolean(this.webhookUrl),
      hasSecret: Boolean(this.webhookSecret),
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5_000,
    };
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

    return this.postWebhook(url, body, 'contact.message.created');
  }

  async testDispatch() {
    const url = this.webhookUrl;
    if (!url) {
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

  private async postWebhook(url: string, body: string, event: string) {
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
      return { dispatched: response.ok };
    } catch (error) {
      this.logger.warn(
        `Contact webhook unavailable: ${(error as Error).message}`,
      );
      return { dispatched: false };
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
}
