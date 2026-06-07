import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { ContactMessagesController } from '../src/contact-messages/contact-messages.controller';
import { ContactMessagesService } from '../src/contact-messages/contact-messages.service';
import { ContactWebhookService } from '../src/contact-messages/contact-webhook.service';

describe('Contact webhook settings (e2e)', () => {
  let app: INestApplication;
  let contactWebhookService: {
    deliveries: jest.Mock;
    retryMessage: jest.Mock;
    processDueRetries: jest.Mock;
    processDueRetriesFromCron: jest.Mock;
    settings: jest.Mock;
    status: jest.Mock;
    testDispatch: jest.Mock;
    updateSettings: jest.Mock;
  };

  beforeEach(async () => {
    contactWebhookService = {
      deliveries: jest.fn(),
      processDueRetries: jest.fn().mockResolvedValue({
        processed: 1,
        results: [{ messageId: 'message-1', dispatched: true, status: 200 }],
      }),
      processDueRetriesFromCron: jest.fn().mockResolvedValue({
        processed: 1,
        results: [{ messageId: 'message-1', dispatched: true, status: 200 }],
      }),
      retryMessage: jest.fn(),
      settings: jest.fn().mockResolvedValue({
        id: 'settings-1',
        enabled: true,
        url: 'https://example.com/webhook',
        event: 'contact.message.created',
        testEvent: 'contact.webhook.test',
        timeoutMs: 5000,
        retryAttempts: 2,
        retryDelayMs: 30000,
        hasSecret: true,
        source: 'database',
      }),
      status: jest.fn().mockResolvedValue({
        configured: true,
        hasSecret: true,
        event: 'contact.message.created',
        testEvent: 'contact.webhook.test',
        timeoutMs: 5000,
        retryAttempts: 2,
        retryDelayMs: 30000,
        retryWorkerEnabled: true,
        retryWorkerIntervalMs: 60000,
      }),
      testDispatch: jest.fn(),
      updateSettings: jest.fn().mockImplementation((data) => ({
        id: 'settings-1',
        hasSecret: true,
        source: 'database',
        ...data,
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessagesController],
      providers: [
        { provide: ContactMessagesService, useValue: {} },
        { provide: ContactWebhookService, useValue: contactWebhookService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns persisted webhook settings without a secret value', async () => {
    const response = await request(app.getHttpServer())
      .get('/contact-messages/webhook/settings')
      .expect(200);

    expect(contactWebhookService.settings).toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        hasSecret: true,
        source: 'database',
        url: 'https://example.com/webhook',
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain('secret-value');
  });

  it('returns webhook status with retry worker metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/contact-messages/webhook/status')
      .expect(200);

    expect(contactWebhookService.status).toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        configured: true,
        hasSecret: true,
        retryWorkerEnabled: true,
        retryWorkerIntervalMs: 60000,
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain('secret-value');
  });

  it('updates webhook settings with a validated and sanitized payload', async () => {
    const response = await request(app.getHttpServer())
      .patch('/contact-messages/webhook/settings')
      .send({
        enabled: true,
        url: 'https://example.com/webhook',
        event: 'contact.message.created',
        testEvent: 'contact.webhook.test',
        timeoutMs: 8000,
        retryAttempts: 1,
        retryDelayMs: 5000,
        secret: 'drop-me',
      })
      .expect(200);

    expect(contactWebhookService.updateSettings).toHaveBeenCalledWith({
      enabled: true,
      url: 'https://example.com/webhook',
      event: 'contact.message.created',
      testEvent: 'contact.webhook.test',
      timeoutMs: 8000,
      retryAttempts: 1,
      retryDelayMs: 5000,
    });
    expect(response.body.secret).toBeUndefined();
  });

  it('rejects invalid webhook URLs before update', async () => {
    await request(app.getHttpServer())
      .patch('/contact-messages/webhook/settings')
      .send({
        enabled: true,
        url: 'not-a-url',
      })
      .expect(400);

    expect(contactWebhookService.updateSettings).not.toHaveBeenCalled();
  });

  it('processes pending webhook retry jobs', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact-messages/webhook/retries/process')
      .expect(201);

    expect(contactWebhookService.processDueRetries).toHaveBeenCalled();
    expect(response.body).toEqual({
      processed: 1,
      results: [{ messageId: 'message-1', dispatched: true, status: 200 }],
    });
  });

  it('processes pending webhook retry jobs from cron secret endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact-messages/webhook/retries/cron')
      .set('X-Portfolio-Cron-Secret', 'cron-secret')
      .expect(200);

    expect(
      contactWebhookService.processDueRetriesFromCron,
    ).toHaveBeenCalledWith('cron-secret');
    expect(response.body).toEqual({
      processed: 1,
      results: [{ messageId: 'message-1', dispatched: true, status: 200 }],
    });
  });
});
