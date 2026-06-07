import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';

type ContactEmailRuntimeConfig = {
  enabled: boolean;
  provider: string;
  apiUrl: string | null;
  apiKey: string | null;
  from: string | null;
  to: string | null;
  timeoutMs: number;
};

@Injectable()
export class ContactEmailNotificationService {
  private readonly logger = new Logger(ContactEmailNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  status() {
    const config = this.runtimeConfig();
    return {
      enabled: config.enabled,
      configured: this.isConfigured(config),
      provider: config.provider,
      apiUrlConfigured: Boolean(config.apiUrl),
      apiKeyConfigured: Boolean(config.apiKey),
      fromConfigured: Boolean(config.from),
      toConfigured: Boolean(config.to),
      timeoutMs: config.timeoutMs,
    };
  }

  async dispatch(message: ContactMessage) {
    const config = this.runtimeConfig();
    if (!this.isConfigured(config)) {
      return {
        configured: false,
        dispatched: false,
        provider: config.provider,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.apiUrl as string, {
        method: 'POST',
        headers: this.headers(config),
        body: JSON.stringify(this.payload(message, config)),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Contact email provider returned ${response.status}`);
        return {
          configured: true,
          dispatched: false,
          provider: config.provider,
          status: response.status,
        };
      }

      return {
        configured: true,
        dispatched: true,
        provider: config.provider,
        status: response.status,
      };
    } catch (error) {
      this.logger.warn(
        `Contact email notification failed: ${errorMessage(error)}`,
      );
      return {
        configured: true,
        dispatched: false,
        provider: config.provider,
        error: errorMessage(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private payload(message: ContactMessage, config: ContactEmailRuntimeConfig) {
    const subject = message.subject
      ? `Nuevo mensaje portfolio: ${message.subject}`
      : `Nuevo mensaje portfolio de ${message.name}`;
    const text = [
      `Nombre: ${message.name}`,
      `Email: ${message.email}`,
      message.subject ? `Asunto: ${message.subject}` : null,
      `Fecha: ${message.createdAt.toISOString()}`,
      '',
      message.message,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      from: config.from,
      to: [config.to],
      subject,
      text,
      reply_to: message.email,
      replyTo: message.email,
    };
  }

  private headers(config: ContactEmailRuntimeConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  private isConfigured(config: ContactEmailRuntimeConfig) {
    return Boolean(
      config.enabled &&
      config.apiUrl &&
      config.apiKey &&
      config.from &&
      config.to,
    );
  }

  private runtimeConfig(): ContactEmailRuntimeConfig {
    const provider = (
      this.configService.get<string>('CONTACT_EMAIL_PROVIDER') || 'disabled'
    )
      .trim()
      .toLowerCase();
    const enabled = provider !== 'disabled' && provider !== 'none';
    const apiUrl =
      this.configService.get<string>('CONTACT_EMAIL_API_URL') ||
      (provider === 'resend' ? 'https://api.resend.com/emails' : null);

    return {
      enabled,
      provider,
      apiUrl,
      apiKey: this.configService.get<string>('CONTACT_EMAIL_API_KEY') || null,
      from: this.configService.get<string>('CONTACT_EMAIL_FROM') || null,
      to: this.configService.get<string>('CONTACT_EMAIL_TO') || null,
      timeoutMs: this.numberConfig(
        'CONTACT_EMAIL_TIMEOUT_MS',
        5000,
        1000,
        30000,
      ),
    };
  }

  private numberConfig(
    key: string,
    fallback: number,
    min: number,
    max: number,
  ) {
    const raw = Number(this.configService.get<string>(key));
    if (!Number.isFinite(raw)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, raw));
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown error';
}
