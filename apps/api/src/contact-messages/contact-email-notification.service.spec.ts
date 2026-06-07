import { ConfigService } from '@nestjs/config';
import { ContactMessage } from '@prisma/client';
import { ContactEmailNotificationService } from './contact-email-notification.service';

const originalFetch = global.fetch;

describe('ContactEmailNotificationService', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('stays disabled until an email provider is configured', async () => {
    const service = createService();

    const result = await service.dispatch(contactMessage());

    expect(result).toEqual({
      configured: false,
      dispatched: false,
      provider: 'disabled',
    });
  });

  it('reports configuration status without exposing provider values', () => {
    const service = createService({
      CONTACT_EMAIL_PROVIDER: 'resend',
      CONTACT_EMAIL_API_KEY: 'secret-key',
      CONTACT_EMAIL_FROM: 'Portfolio <portfolio@example.com>',
      CONTACT_EMAIL_TO: 'abel@example.com',
      CONTACT_EMAIL_TIMEOUT_MS: '9000',
    });

    expect(service.status()).toEqual({
      enabled: true,
      configured: true,
      provider: 'resend',
      apiUrlConfigured: true,
      apiKeyConfigured: true,
      fromConfigured: true,
      toConfigured: true,
      timeoutMs: 9000,
    });
    expect(JSON.stringify(service.status())).not.toContain('secret-key');
    expect(JSON.stringify(service.status())).not.toContain('abel@example.com');
  });

  it('sends a privacy-limited contact email payload to the provider', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    global.fetch = fetchMock as never;
    const service = createService({
      CONTACT_EMAIL_PROVIDER: 'resend',
      CONTACT_EMAIL_API_KEY: 'secret-key',
      CONTACT_EMAIL_FROM: 'Portfolio <portfolio@example.com>',
      CONTACT_EMAIL_TO: 'abel@example.com',
    });

    const result = await service.dispatch(contactMessage());

    expect(result).toEqual({
      configured: true,
      dispatched: true,
      provider: 'resend',
      status: 202,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secret-key',
        },
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual(
      expect.objectContaining({
        from: 'Portfolio <portfolio@example.com>',
        to: ['abel@example.com'],
        reply_to: 'recruiter@example.com',
        replyTo: 'recruiter@example.com',
      }),
    );
    expect(body.text).toContain('Recruiter Demo');
    expect(body.text).toContain('recruiter@example.com');
    expect(body.text).not.toContain('ipHash');
    expect(body.text).not.toContain('userAgent');
  });
});

function createService(values: Record<string, string> = {}) {
  return new ContactEmailNotificationService(mockConfig(values));
}

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function contactMessage(): ContactMessage {
  return {
    id: 'message-1',
    name: 'Recruiter Demo',
    email: 'recruiter@example.com',
    subject: 'Oferta Project Manager',
    message: 'Podemos hablar esta semana?',
    status: 'unread',
    ipHash: 'hash',
    userAgent: 'ua',
    createdAt: new Date('2026-06-06T08:00:00.000Z'),
    updatedAt: new Date('2026-06-06T08:00:00.000Z'),
    deletedAt: null,
  };
}
