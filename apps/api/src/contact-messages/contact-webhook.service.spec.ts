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
  contactWebhookSetting: {
    create: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
  },
  contactWebhookRetryJob: {
    create: jest.fn().mockResolvedValue({ id: 'retry-job-1' }),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
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

  it('reports webhook configuration without exposing the secret', async () => {
    const service = createService({
      CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
      CONTACT_WEBHOOK_SECRET: 'secret-value',
    });

    await expect(service.status()).resolves.toEqual({
      configured: true,
      hasSecret: true,
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5000,
      retryAttempts: 2,
      retryDelayMs: 30000,
      retryWorkerEnabled: true,
      retryWorkerIntervalMs: 60000,
    });
  });

  it('reports disabled webhook retry worker configuration', async () => {
    const service = createService({
      CONTACT_WEBHOOK_RETRY_WORKER_ENABLED: 'false',
      CONTACT_WEBHOOK_RETRY_WORKER_INTERVAL_MS: '120000',
    });

    await expect(service.status()).resolves.toEqual(
      expect.objectContaining({
        retryWorkerEnabled: false,
        retryWorkerIntervalMs: 120000,
      }),
    );
  });

  it('uses persisted webhook settings without exposing the secret', async () => {
    const prisma = createPrisma();
    prisma.contactWebhookSetting.findFirst.mockResolvedValue({
      id: 'settings-1',
      enabled: true,
      url: 'https://db.example.com/webhook',
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 8000,
      retryAttempts: 1,
      retryDelayMs: 5000,
    });
    const service = createService(
      {
        CONTACT_WEBHOOK_URL: 'https://env.example.com/webhook',
        CONTACT_WEBHOOK_SECRET: 'secret-value',
      },
      prisma,
    );

    await expect(service.settings()).resolves.toEqual({
      id: 'settings-1',
      enabled: true,
      url: 'https://db.example.com/webhook',
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 8000,
      retryAttempts: 1,
      retryDelayMs: 5000,
      retryWorkerEnabled: true,
      retryWorkerIntervalMs: 60000,
      hasSecret: true,
      source: 'database',
    });
  });

  it('updates persisted webhook settings without storing a secret', async () => {
    const prisma = createPrisma();
    prisma.contactWebhookSetting.create.mockResolvedValue({
      id: 'settings-1',
      enabled: true,
      url: 'https://db.example.com/webhook',
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 8000,
      retryAttempts: 1,
      retryDelayMs: 5000,
    });
    const service = createService(
      { CONTACT_WEBHOOK_SECRET: 'secret-value' },
      prisma,
    );

    const result = await service.updateSettings({
      enabled: true,
      url: 'https://db.example.com/webhook',
      timeoutMs: 8000,
      retryAttempts: 1,
      retryDelayMs: 5000,
    });

    expect(prisma.contactWebhookSetting.create).toHaveBeenCalledWith({
      data: {
        enabled: true,
        url: 'https://db.example.com/webhook',
        event: 'contact.message.created',
        testEvent: 'contact.webhook.test',
        timeoutMs: 8000,
        retryAttempts: 1,
        retryDelayMs: 5000,
        deletedAt: null,
      },
    });
    expect(
      JSON.stringify(prisma.contactWebhookSetting.create.mock.calls),
    ).not.toContain('secret-value');
    expect(result).toEqual(
      expect.objectContaining({
        hasSecret: true,
        source: 'database',
      }),
    );
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

  it('persists retry jobs for failed deliveries when worker is enabled', async () => {
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
    expect(jest.getTimerCount()).toBe(0);
    expect(prisma.contactWebhookRetryJob.create).toHaveBeenCalledWith({
      data: {
        messageId: 'message-1',
        attempt: 1,
        runAt: expect.any(Date),
      },
    });
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

  it('uses local retry timer when the retry worker is disabled', async () => {
    jest.useFakeTimers();
    const prisma = createPrisma();
    const service = createService(
      {
        CONTACT_WEBHOOK_URL: 'https://example.com/webhook',
        CONTACT_WEBHOOK_RETRY_ATTEMPTS: '1',
        CONTACT_WEBHOOK_RETRY_DELAY_MS: '1000',
        CONTACT_WEBHOOK_RETRY_WORKER_ENABLED: 'false',
      },
      prisma,
    );
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: false, status: 503 }),
    });

    await service.dispatch(message);

    expect(jest.getTimerCount()).toBe(1);
  });

  it('processes due persistent retry jobs', async () => {
    const prisma = createPrisma();
    prisma.contactWebhookRetryJob.findMany.mockResolvedValue([
      {
        id: 'retry-job-1',
        messageId: 'message-1',
        attempt: 1,
        status: 'pending',
        runAt: new Date('2026-06-07T08:00:00.000Z'),
      },
    ]);
    prisma.contactWebhookRetryJob.findUnique.mockResolvedValue({
      id: 'retry-job-1',
      messageId: 'message-1',
      attempt: 1,
      status: 'pending',
    });
    prisma.contactMessage.findUnique.mockResolvedValue(message);
    prisma.contactWebhookSetting.findFirst.mockResolvedValue({
      id: 'settings-1',
      enabled: true,
      url: 'https://example.com/webhook',
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 5000,
      retryAttempts: 1,
      retryDelayMs: 1000,
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
    });
    const service = createService({}, prisma);

    const result = await service.processDueRetries(
      new Date('2026-06-07T08:05:00.000Z'),
    );

    expect(prisma.contactWebhookRetryJob.findMany).toHaveBeenCalledWith({
      where: {
        status: 'pending',
        runAt: { lte: new Date('2026-06-07T08:05:00.000Z') },
      },
      orderBy: { runAt: 'asc' },
      take: 10,
    });
    expect(prisma.contactWebhookRetryJob.update).toHaveBeenCalledWith({
      where: { id: 'retry-job-1' },
      data: {
        status: 'completed',
        resultJson: {
          messageId: 'message-1',
          dispatched: true,
          status: 200,
        },
      },
    });
    expect(result).toEqual({
      processed: 1,
      results: [
        {
          jobId: 'retry-job-1',
          messageId: 'message-1',
          dispatched: true,
          status: 200,
        },
      ],
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
