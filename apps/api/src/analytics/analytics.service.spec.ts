import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService filters', () => {
  it('applies date range to summary counts', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    const service = createService(prisma);

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
    const service = createService(prisma);

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
    const service = createService(prisma);

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
    const service = createService(mockPrisma());

    await expect(
      service.summary({ from: '2026-06-05', to: '2026-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hashes IP with optional salt and can drop user agent storage', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });
    const service = createService(prisma, {
      ANALYTICS_IP_HASH_SALT: 'salt',
      ANALYTICS_STORE_USER_AGENT: 'false',
    });

    await service.record(
      {
        type: 'landing_visit',
        path: '/?utm_source=linkedin&utm_medium=social',
      },
      '127.0.0.1',
      'ua',
    );

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: {
          source: 'linkedin',
          channel: 'social',
        },
        ipHash: createHash('sha256').update('salt:127.0.0.1').digest('hex'),
        userAgent: null,
      }),
    });
  });

  it('prunes analytics events older than configured retention', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.deleteMany.mockResolvedValue({ count: 3 });
    const service = createService(prisma, {
      ANALYTICS_RETENTION_DAYS: '30',
    });

    const result = await service.pruneRetention(
      new Date('2026-06-30T00:00:00.000Z'),
    );

    expect(prisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: new Date('2026-05-31T00:00:00.000Z') } },
    });
    expect(result).toMatchObject({ retentionDays: 30, deleted: 3 });
  });

  it('builds daily time series with empty days in ranged filters', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        type: 'landing_visit',
      },
      { createdAt: new Date('2026-06-01T11:00:00.000Z'), type: 'cv_download' },
      {
        createdAt: new Date('2026-06-03T12:00:00.000Z'),
        type: 'landing_visit',
      },
    ]);
    const service = createService(prisma);

    const result = await service.timeSeries({
      from: '2026-06-01',
      to: '2026-06-03',
    });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-03T23:59:59.999Z'),
        },
      },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([
      {
        date: '2026-06-01',
        total: 2,
        types: { landing_visit: 1, cv_download: 1 },
      },
      { date: '2026-06-02', total: 0, types: {} },
      { date: '2026-06-03', total: 1, types: { landing_visit: 1 } },
    ]);
  });

  it('aggregates source and channel segments from metadata and paths', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([
      {
        metadata: { source: 'linkedin', channel: 'social' },
        path: '/',
      },
      {
        metadata: null,
        path: '/?utm_source=email&utm_medium=newsletter',
      },
      {
        metadata: { source: 'linkedin', channel: 'social' },
        path: '/cv',
      },
    ]);
    const service = createService(prisma);

    const result = await service.channels({ type: 'landing_visit' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: { type: 'landing_visit' },
      select: { metadata: true, path: true },
    });
    expect(result).toEqual({
      sources: [
        { name: 'linkedin', count: 2 },
        { name: 'email', count: 1 },
      ],
      channels: [
        { name: 'social', count: 2 },
        { name: 'newsletter', count: 1 },
      ],
    });
  });

  it('aggregates event labels for target role usage', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { label: 'Delivery Manager', path: '/admin/cv/adapt?targetRoleId=1' },
      { label: 'Delivery Manager', path: '/admin/cv/adapt?targetRoleId=1' },
      { label: 'IT Project Manager', path: '/admin/cv/adapt' },
      { label: null, path: null },
    ]);
    const service = createService(prisma);

    const result = await service.labels({ type: 'cv_adaptation' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: { type: 'cv_adaptation' },
      select: { label: true, path: true },
    });
    expect(result).toEqual({
      labels: [
        { name: 'Delivery Manager', count: 2 },
        { name: 'IT Project Manager', count: 1 },
        { name: 'sin_etiqueta', count: 1 },
      ],
      paths: [
        { name: '/admin/cv/adapt?targetRoleId=1', count: 2 },
        { name: '/admin/cv/adapt', count: 1 },
        { name: 'sin_ruta', count: 1 },
      ],
    });
  });

  it('builds a landing to CV/contact conversion funnel', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    const service = createService(prisma);

    const result = await service.funnel({
      from: '2026-06-01',
      to: '2026-06-02',
    });

    expect(result).toEqual({
      steps: [
        {
          key: 'landing_visit',
          label: 'Visitas landing',
          count: 20,
          rateFromStart: 100,
          rateFromPrevious: 100,
        },
        {
          key: 'cv_download',
          label: 'Descargas CV',
          count: 5,
          rateFromStart: 25,
          rateFromPrevious: 25,
        },
        {
          key: 'contact_submit',
          label: 'Formularios contacto',
          count: 2,
          rateFromStart: 10,
          rateFromPrevious: 40,
        },
      ],
    });
  });
});

function createService(
  prisma: ReturnType<typeof mockPrisma>,
  config: Record<string, string> = {},
) {
  return new AnalyticsService(prisma as never, mockConfig(config));
}

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function mockPrisma() {
  return {
    analyticsEvent: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };
}
