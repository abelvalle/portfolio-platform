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
});
