import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService filters', () => {
  it('applies date range to summary counts', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    const service = new AnalyticsService(prisma as never);

    const result = await service.summary({
      from: '2026-06-01',
      to: '2026-06-05',
    });

    expect(result).toEqual({
      totalVisits: 4,
      cvDownloads: 3,
      contactSubmits: 2,
      projectViews: 1,
    });
    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-05T23:59:59.999Z'),
        },
        type: 'landing_visit',
      },
    });
  });

  it('applies date range to event list', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    const service = new AnalyticsService(prisma as never);

    await service.list({ from: '2026-06-01' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  });

  it('applies event type to event list', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    const service = new AnalyticsService(prisma as never);

    await service.list({ from: '2026-06-01', type: 'cv_download' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
        },
        type: 'cv_download',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  });

  it('rejects inverted date ranges', async () => {
    const service = new AnalyticsService(mockPrisma() as never);

    await expect(
      service.summary({ from: '2026-06-05', to: '2026-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function mockPrisma() {
  return {
    analyticsEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
}
