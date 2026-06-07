import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) };
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      expect(appController.getHealth()).toEqual({
        name: 'portfolio-platform-api',
        status: 'ok',
        version: '0.1.0',
      });
    });

    it('should return liveness metadata', () => {
      expect(appController.getLiveness()).toEqual(
        expect.objectContaining({
          name: 'portfolio-platform-api',
          status: 'ok',
          version: '0.1.0',
          check: 'liveness',
          uptimeSeconds: expect.any(Number),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should return readiness when database responds', async () => {
      await expect(appController.getReadiness()).resolves.toEqual(
        expect.objectContaining({
          name: 'portfolio-platform-api',
          status: 'ready',
          version: '0.1.0',
          check: 'readiness',
          checks: { database: 'ok' },
          timestamp: expect.any(String),
        }),
      );
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should fail readiness when database is unavailable', async () => {
      prisma.$queryRaw.mockRejectedValueOnce(new Error('db down'));

      await expect(appController.getReadiness()).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 'not_ready',
          checks: { database: 'error' },
        }),
      });
    });
  });
});
