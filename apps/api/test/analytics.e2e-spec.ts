import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let analyticsService: {
    createGoal: jest.Mock;
    goalProgress: jest.Mock;
    goals: jest.Mock;
    privacyStatus: jest.Mock;
    pruneRetention: jest.Mock;
    removeGoal: jest.Mock;
    updateGoal: jest.Mock;
  };

  beforeEach(async () => {
    analyticsService = {
      createGoal: jest.fn().mockResolvedValue({
        id: 'goal-2',
        key: 'monthly-cv-downloads',
        name: 'Descargas CV mensuales',
        eventType: 'cv_download',
        eventTypes: ['cv_download', 'contact_submit'],
        targetCount: 20,
        period: 'monthly',
        visible: true,
        order: 1,
      }),
      goalProgress: jest.fn().mockResolvedValue([
        {
          id: 'goal-1',
          key: 'sample-cv-downloads',
          name: 'Descargas CV sample/demo',
          eventType: 'cv_download',
          eventTypes: ['cv_download', 'contact_submit'],
          targetCount: 3,
          period: 'monthly',
          visible: true,
          order: 0,
          count: 2,
          progressRate: 66.7,
          achieved: false,
          remainingCount: 1,
          alertLevel: 'info',
          alertMessage: 'Faltan 1 evento para cerrar el objetivo.',
        },
      ]),
      goals: jest.fn().mockResolvedValue([
        {
          id: 'goal-1',
          key: 'sample-cv-downloads',
          name: 'Descargas CV sample/demo',
          eventType: 'cv_download',
          targetCount: 3,
          period: 'monthly',
          visible: true,
          order: 0,
        },
      ]),
      privacyStatus: jest.fn().mockReturnValue({
        retentionDays: 30,
        storeUserAgent: false,
        ipHashSaltConfigured: true,
        retentionWorkerEnabled: true,
        retentionWorkerIntervalMs: 86400000,
      }),
      pruneRetention: jest.fn().mockResolvedValue({
        retentionDays: 30,
        deleted: 2,
      }),
      removeGoal: jest.fn().mockResolvedValue({
        id: 'goal-1',
        visible: false,
      }),
      updateGoal: jest.fn().mockResolvedValue({
        id: 'goal-1',
        name: 'Descargas CV actualizadas',
        eventType: 'cv_download',
        targetCount: 10,
        period: 'monthly',
        visible: true,
        order: 0,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: analyticsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns analytics privacy status with retention worker metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/privacy')
      .expect(200);

    expect(analyticsService.privacyStatus).toHaveBeenCalled();
    expect(response.body).toEqual({
      retentionDays: 30,
      storeUserAgent: false,
      ipHashSaltConfigured: true,
      retentionWorkerEnabled: true,
      retentionWorkerIntervalMs: 86400000,
    });
  });

  it('prunes analytics retention through the protected HTTP contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/analytics/retention/prune')
      .expect(201);

    expect(analyticsService.pruneRetention).toHaveBeenCalled();
    expect(response.body).toEqual({
      retentionDays: 30,
      deleted: 2,
    });
  });

  it('returns analytics goal progress through the HTTP contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/goals/progress?from=2026-06-01&to=2026-06-30')
      .expect(200);

    expect(analyticsService.goalProgress).toHaveBeenCalledWith({
      from: '2026-06-01',
      to: '2026-06-30',
    });
    expect(response.body).toEqual([
      {
        id: 'goal-1',
        key: 'sample-cv-downloads',
        name: 'Descargas CV sample/demo',
        eventType: 'cv_download',
        eventTypes: ['cv_download', 'contact_submit'],
        targetCount: 3,
        period: 'monthly',
        visible: true,
        order: 0,
        count: 2,
        progressRate: 66.7,
        achieved: false,
        remainingCount: 1,
        alertLevel: 'info',
        alertMessage: 'Faltan 1 evento para cerrar el objetivo.',
      },
    ]);
  });

  it('creates analytics goals through the protected HTTP contract', async () => {
    const body = {
      key: 'monthly-cv-downloads',
      name: 'Descargas CV mensuales',
      eventType: 'cv_download',
      eventTypes: ['cv_download', 'contact_submit'],
      targetCount: 20,
      period: 'monthly',
      visible: true,
      order: 1,
    };

    const response = await request(app.getHttpServer())
      .post('/analytics/goals')
      .send(body)
      .expect(201);

    expect(analyticsService.createGoal).toHaveBeenCalledWith(body);
    expect(response.body).toEqual({
      id: 'goal-2',
      key: 'monthly-cv-downloads',
      name: 'Descargas CV mensuales',
      eventType: 'cv_download',
      eventTypes: ['cv_download', 'contact_submit'],
      targetCount: 20,
      period: 'monthly',
      visible: true,
      order: 1,
    });
  });
});
