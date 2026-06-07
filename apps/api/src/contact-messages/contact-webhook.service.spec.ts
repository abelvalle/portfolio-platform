import { ConfigService } from '@nestjs/config';
import { ContactWebhookService } from './contact-webhook.service';

const createPrisma = () => ({
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  contactMessage: {
    findUnique: jest.fn(),
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
    jest.useRealTimers();
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
      retryAttempts: 2,
      retryDelayMs: 30000,
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

  it('schedules automatic retry for failed message deliveries', async () => {
    jest.useFakeTimers();
    const prisma = createPrisma();
    const service = createService(
      {
        CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
        CONTACT_WEBHOOK_RETRY_ATTEMPTS: '1',
        CONTACT_WEBHOOK_RETRY_DELAY_MS: '1000',
      },
      prisma,
    );
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: false, status: 503 }),
    });

    const result = await service.dispatch(message);

    expect(result).toEqual({ dispatched: false, status: 503 });
    expect(jest.getTimerCount()).toBe(1);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'contact.webhook.delivery',
        resource: 'contact-webhook',
        resourceId: 'contact.message.created',
        metadata: {
          event: 'contact.message.created',
          configured: true,
          dispatched: false,
          messageId: 'message-1',
          status: 503,
        },
      },
    });
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

  it('lists recent webhook deliveries from audit logs', async () => {
    const prisma = createPrisma();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        resourceId: 'contact.message.created',
        metadata: {
          event: 'contact.message.created',
          configured: true,
          dispatched: true,
          messageId: 'message-1',
          status: 202,
          retryAttempt: 1,
          ignored: 'not-returned',
        },
        createdAt: new Date('2026-06-06T08:30:00.000Z'),
      },
      {
        id: 'audit-2',
        resourceId: 'contact.webhook.test',
        metadata: {
          event: 'contact.webhook.test',
          configured: true,
          dispatched: false,
          error: 'fetch failed',
        },
        createdAt: new Date('2026-06-06T08:31:00.000Z'),
      },
    ]);
    const service = createService({}, prisma);

    const result = await service.deliveries();

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        action: 'contact.webhook.delivery',
        resource: 'contact-webhook',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    expect(result).toEqual([
      {
        id: 'audit-1',
        event: 'contact.message.created',
        configured: true,
        dispatched: true,
        status: 202,
        error: null,
        messageId: 'message-1',
        retryAttempt: 1,
        createdAt: new Date('2026-06-06T08:30:00.000Z'),
      },
      {
        id: 'audit-2',
        event: 'contact.webhook.test',
        configured: true,
        dispatched: false,
        status: null,
        error: 'fetch failed',
        messageId: null,
        retryAttempt: null,
        createdAt: new Date('2026-06-06T08:31:00.000Z'),
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('not-returned');
  });

  it('retries a failed message delivery from the stored contact message', async () => {
    const prisma = createPrisma();
    prisma.contactMessage.findUnique.mockResolvedValue(message);
    const service = createService(
      {
        CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
        CONTACT_WEBHOOK_SECRET: 'secret-value',
      },
      prisma,
    );
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
    });

    const result = await service.retryMessage('message-1');

    expect(prisma.contactMessage.findUnique).toHaveBeenCalledWith({
      where: { id: 'message-1' },
    });
    expect(result).toEqual({
      messageId: 'message-1',
      dispatched: true,
      status: 200,
    });
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
          status: 200,
        },
      },
    });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain(
      'Mensaje de prueba',
    );
  });
});
