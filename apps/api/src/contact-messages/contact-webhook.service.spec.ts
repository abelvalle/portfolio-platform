import { ConfigService } from '@nestjs/config';
import { ContactWebhookService } from './contact-webhook.service';

const createPrisma = () => ({
  auditLog: {
    create: jest.fn(),
  },
});

const createService = (
  config: Record<string, string | undefined>,
  prisma = createPrisma(),
) =>
  new ContactWebhookService(
    {
      get: (key: string) => config[key],
    } as unknown as ConfigService,
    prisma as never,
  );

const message = {
  id: 'message-1',
  name: 'Abel',
  email: 'abel@example.com',
  subject: 'Contacto',
  message: 'Mensaje de prueba',
  status: 'unread',
  ipHash: null,
  userAgent: null,
  createdAt: new Date('2026-06-06T08:00:00.000Z'),
  updatedAt: new Date('2026-06-06T08:00:00.000Z'),
  deletedAt: null,
};

describe('ContactWebhookService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not dispatch when CONTACT_WEBHOOK_URL is not configured', async () => {
    const prisma = createPrisma();
    const service = createService({}, prisma);

    const result = await service.dispatch(message);

    expect(result).toEqual({ dispatched: false });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('reports webhook configuration without exposing the secret', () => {
    const service = createService({
      CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
      CONTACT_WEBHOOK_SECRET: 'secret-value',
    });

    expect(service.status()).toEqual({
      configured: true,
      hasSecret: true,
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5000,
    });
  });

  it('audits successful webhook deliveries without storing secrets or payload body', async () => {
    const prisma = createPrisma();
    const service = createService(
      {
        CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
        CONTACT_WEBHOOK_SECRET: 'secret-value',
      },
      prisma,
    );
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 202 } as Response);

    const result = await service.dispatch(message);

    expect(result).toEqual({ dispatched: true, status: 202 });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'contact.webhook.delivery',
        resource: 'contact-webhook',
        resourceId: 'contact.message.created',
        metadata: {
          event: 'contact.message.created',
          configured: true,
          dispatched: true,
          messageId: 'message-1',
          status: 202,
        },
      },
    });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain(
      'secret-value',
    );
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain(
      'Mensaje de prueba',
    );
  });

  it('audits manual test attempts when webhook is not configured', async () => {
    const prisma = createPrisma();
    const service = createService({}, prisma);

    const result = await service.testDispatch();

    expect(result).toEqual({ configured: false, dispatched: false });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'contact.webhook.delivery',
        resource: 'contact-webhook',
        resourceId: 'contact.webhook.test',
        metadata: {
          event: 'contact.webhook.test',
          configured: false,
          dispatched: false,
        },
      },
    });
  });
});
