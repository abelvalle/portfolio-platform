import { ConfigService } from '@nestjs/config';
import { ContactWebhookService } from './contact-webhook.service';

describe('ContactWebhookService', () => {
  it('does not dispatch when CONTACT_WEBHOOK_URL is not configured', async () => {
    const service = new ContactWebhookService({
      get: () => undefined,
    } as unknown as ConfigService);

    const result = await service.dispatch({
      id: 'message-1',
      name: 'Abel',
      email: 'abel@example.com',
      subject: 'Contacto',
      message: 'Mensaje de prueba',
      status: 'unread',
      ipHash: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    expect(result).toEqual({ dispatched: false });
  });

  it('reports webhook configuration without exposing the secret', () => {
    const service = new ContactWebhookService({
      get: (key: string) =>
        ({
          CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
          CONTACT_WEBHOOK_SECRET: 'secret-value',
        })[key],
    } as unknown as ConfigService);

    expect(service.status()).toEqual({
      configured: true,
      hasSecret: true,
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5000,
    });
  });
});
