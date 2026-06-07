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
    privacyStatus: jest.Mock;
    pruneRetention: jest.Mock;
  };

  beforeEach(async () => {
    analyticsService = {
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
});
