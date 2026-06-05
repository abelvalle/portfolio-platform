import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';
import { createHmac } from 'node:crypto';

@Injectable()
export class ContactWebhookService {
  private readonly logger = new Logger(ContactWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  async dispatch(message: ContactMessage) {
    const url = this.configService.get<string>('CONTACT_WEBHOOK_URL');
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers(body),
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

  private headers(body: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Portfolio-Event': 'contact.message.created',
    };
    const secret = this.configService.get<string>('CONTACT_WEBHOOK_SECRET');
    if (secret) {
      headers['X-Portfolio-Signature'] = createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }
    return headers;
  }
}
