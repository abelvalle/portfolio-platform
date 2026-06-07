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

  it('exports filtered events as CSV', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([
      {
        type: 'cv_download',
        path: '/cv?template=ats',
        label: 'CV "ATS"',
        createdAt: new Date('2026-06-06T08:00:00.000Z'),
      },
    ]);
    const service = createService(prisma);

    const result = await service.exportCsv({ type: 'cv_download' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: { type: 'cv_download' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    expect(result).toBe(
      '"type","path","label","createdAt"\n"cv_download","/cv?template=ats","CV ""ATS""","2026-06-06T08:00:00.000Z"',
    );
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

  it('reports retention worker privacy status without sensitive values', () => {
    const service = createService(mockPrisma(), {
      ANALYTICS_RETENTION_DAYS: '30',
      ANALYTICS_RETENTION_WORKER_INTERVAL_MS: '120000',
      ANALYTICS_IP_HASH_SALT: 'salt',
    });

    expect(service.privacyStatus()).toEqual({
      retentionDays: 30,
      storeUserAgent: true,
      ipHashSaltConfigured: true,
      retentionWorkerEnabled: true,
      retentionWorkerIntervalMs: 120000,
    });
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
      {
        label: 'Delivery Manager',
        path: '/admin/cv/adapt?baseCvVersionId=cv-base&targetRoleId=1',
        metadata: {
          basecvversionid: 'cv-base',
          targetroleid: 'target-role-1',
          hastargetcompany: 'false',
        },
      },
      {
        label: 'Delivery Manager',
        path: '/admin/cv/adapt?baseCvVersionId=cv-base&targetRoleId=1',
        metadata: {
          basecvversionid: 'cv-base',
          targetroleid: 'target-role-1',
          hastargetcompany: 'false',
        },
      },
      {
        label: 'IT Project Manager',
        path: '/admin/cv/adapt',
        metadata: { basecvversionid: 'cv-alt', hastargetcompany: 'true' },
      },
      { label: null, path: null, metadata: null },
    ]);
    const service = createService(prisma);

    const result = await service.labels({ type: 'cv_adaptation' });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: { type: 'cv_adaptation' },
      select: { label: true, path: true, metadata: true },
    });
    expect(result).toEqual({
      labels: [
        { name: 'Delivery Manager', count: 2 },
        { name: 'IT Project Manager', count: 1 },
        { name: 'sin_etiqueta', count: 1 },
      ],
      paths: [
        {
          name: '/admin/cv/adapt?baseCvVersionId=cv-base&targetRoleId=1',
          count: 2,
        },
        { name: '/admin/cv/adapt', count: 1 },
        { name: 'sin_ruta', count: 1 },
      ],
      contexts: [
        {
          name: 'base=cv-base | role=target-role-1 | company=false',
          count: 2,
        },
        { name: 'base=cv-alt | company=true', count: 1 },
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

  it('builds a configurable conversion funnel from query steps', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(3);
    const service = createService(prisma);

    const result = await service.funnel({
      from: '2026-06-01',
      to: '2026-06-02',
      steps: 'landing_visit,project_view,contact_submit',
    });

    expect(prisma.analyticsEvent.count).toHaveBeenNthCalledWith(1, {
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-02T23:59:59.999Z'),
        },
        type: 'landing_visit',
      },
    });
    expect(prisma.analyticsEvent.count).toHaveBeenNthCalledWith(2, {
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-02T23:59:59.999Z'),
        },
        type: 'project_view',
      },
    });
    expect(result).toEqual({
      steps: [
        {
          key: 'landing_visit',
          label: 'Visitas landing',
          count: 12,
          rateFromStart: 100,
          rateFromPrevious: 100,
        },
        {
          key: 'project_view',
          label: 'Vistas proyecto',
          count: 6,
          rateFromStart: 50,
          rateFromPrevious: 50,
        },
        {
          key: 'contact_submit',
          label: 'Formularios contacto',
          count: 3,
          rateFromStart: 25,
          rateFromPrevious: 50,
        },
      ],
    });
  });

  it('rejects invalid configurable funnel steps', async () => {
    const service = createService(mockPrisma());

    await expect(
      service.funnel({ steps: 'landing_visit' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.funnel({ steps: 'landing_visit,../contact' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists visible persisted funnel definitions', async () => {
    const prisma = mockPrisma();
    prisma.analyticsFunnelDefinition.findMany.mockResolvedValue([
      {
        id: 'funnel-1',
        key: 'landing-project-contact',
        name: 'Landing -> Proyecto -> Contacto',
        steps: ['landing_visit', 'project_view', 'contact_submit'],
        visible: true,
      },
    ]);
    const service = createService(prisma);

    const result = await service.funnelDefinitions();

    expect(prisma.analyticsFunnelDefinition.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, visible: true },
      orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
    });
    expect(result).toHaveLength(1);
  });

  it('creates sanitized persisted funnel definitions', async () => {
    const prisma = mockPrisma();
    prisma.analyticsFunnelDefinition.create.mockResolvedValue({
      id: 'funnel-1',
    });
    const service = createService(prisma);

    await service.createFunnelDefinition({
      key: 'landing-project-contact',
      name: ' Landing -> Proyecto -> Contacto ',
      description: ' Valida proyectos ',
      steps: ['landing_visit', 'project_view', 'contact_submit'],
      visible: false,
      order: 2,
    });

    expect(prisma.analyticsFunnelDefinition.create).toHaveBeenCalledWith({
      data: {
        key: 'landing-project-contact',
        name: 'Landing -> Proyecto -> Contacto',
        description: 'Valida proyectos',
        steps: ['landing_visit', 'project_view', 'contact_submit'],
        visible: false,
        order: 2,
      },
    });
  });

  it('soft deletes persisted funnel definitions', async () => {
    const prisma = mockPrisma();
    prisma.analyticsFunnelDefinition.findUnique.mockResolvedValue({
      id: 'funnel-1',
      deletedAt: null,
    });
    prisma.analyticsFunnelDefinition.update.mockResolvedValue({
      id: 'funnel-1',
      visible: false,
    });
    const service = createService(prisma);

    await service.removeFunnelDefinition('funnel-1');

    expect(prisma.analyticsFunnelDefinition.findUnique).toHaveBeenCalledWith({
      where: { id: 'funnel-1' },
    });
    expect(prisma.analyticsFunnelDefinition.update).toHaveBeenCalledWith({
      where: { id: 'funnel-1' },
      data: { deletedAt: expect.any(Date), visible: false },
    });
  });

  it('creates sanitized analytics goals', async () => {
    const prisma = mockPrisma();
    prisma.analyticsGoal.create.mockResolvedValue({ id: 'goal-1' });
    const service = createService(prisma);

    await service.createGoal({
      key: 'monthly-cv-downloads',
      name: ' Descargas CV mensuales ',
      description: ' sample/demo ',
      eventType: 'cv_download',
      eventTypes: [' cv_download ', 'contact_submit', 'cv_download'],
      targetCount: 20,
      period: 'monthly',
      visible: true,
      order: 1,
    });

    expect(prisma.analyticsGoal.create).toHaveBeenCalledWith({
      data: {
        key: 'monthly-cv-downloads',
        name: 'Descargas CV mensuales',
        description: 'sample/demo',
        eventType: 'cv_download',
        eventTypes: ['cv_download', 'contact_submit'],
        targetCount: 20,
        period: 'monthly',
        visible: true,
        order: 1,
      },
    });
  });

  it('builds analytics goal progress from filtered events', async () => {
    const prisma = mockPrisma();
    prisma.analyticsGoal.findMany.mockResolvedValue([
      {
        id: 'goal-1',
        key: 'monthly-cv-downloads',
        name: 'Descargas CV mensuales',
        eventType: 'cv_download',
        eventTypes: [],
        targetCount: 10,
        period: 'monthly',
        visible: true,
        order: 0,
      },
    ]);
    prisma.analyticsEvent.count.mockResolvedValue(6);
    const service = createService(prisma);

    const result = await service.goalProgress({
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(prisma.analyticsGoal.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, visible: true },
      orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
    });
    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-30T23:59:59.999Z'),
        },
        type: 'cv_download',
      },
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'goal-1',
        eventTypes: ['cv_download'],
        count: 6,
        progressRate: 60,
        achieved: false,
        remainingCount: 4,
        alertLevel: 'info',
        alertMessage: 'Faltan 4 eventos para cerrar el objetivo.',
      }),
    ]);
  });

  it('builds composite analytics goal progress from multiple event types', async () => {
    const prisma = mockPrisma();
    prisma.analyticsGoal.findMany.mockResolvedValue([
      {
        id: 'goal-1',
        key: 'monthly-engagement',
        name: 'Acciones de interes',
        eventType: 'project_view',
        eventTypes: ['project_view', 'cv_download', 'contact_submit'],
        targetCount: 10,
        period: 'monthly',
        visible: true,
        order: 0,
      },
    ]);
    prisma.analyticsEvent.count.mockResolvedValue(7);
    const service = createService(prisma);

    const result = await service.goalProgress({
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-30T23:59:59.999Z'),
        },
        type: { in: ['project_view', 'cv_download', 'contact_submit'] },
      },
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'goal-1',
        eventTypes: ['project_view', 'cv_download', 'contact_submit'],
        count: 7,
        progressRate: 70,
        achieved: false,
        remainingCount: 3,
      }),
    ]);
  });

  it('soft deletes analytics goals', async () => {
    const prisma = mockPrisma();
    prisma.analyticsGoal.findUnique.mockResolvedValue({
      id: 'goal-1',
      deletedAt: null,
    });
    prisma.analyticsGoal.update.mockResolvedValue({
      id: 'goal-1',
      visible: false,
    });
    const service = createService(prisma);

    await service.removeGoal('goal-1');

    expect(prisma.analyticsGoal.findUnique).toHaveBeenCalledWith({
      where: { id: 'goal-1' },
    });
    expect(prisma.analyticsGoal.update).toHaveBeenCalledWith({
      where: { id: 'goal-1' },
      data: { deletedAt: expect.any(Date), visible: false },
    });
  });

  it('builds a source and channel conversion funnel', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.findMany.mockResolvedValue([
      {
        type: 'landing_visit',
        metadata: { source: 'linkedin', channel: 'social' },
        path: '/',
      },
      {
        type: 'landing_visit',
        metadata: { source: 'linkedin', channel: 'social' },
        path: '/',
      },
      {
        type: 'cv_download',
        metadata: { source: 'linkedin', channel: 'social' },
        path: '/cv',
      },
      {
        type: 'contact_submit',
        metadata: null,
        path: '/contact?utm_source=email&utm_medium=newsletter',
      },
      {
        type: 'landing_visit',
        metadata: null,
        path: '/',
      },
    ]);
    const service = createService(prisma);

    const result = await service.channelFunnel({
      from: '2026-06-01',
      to: '2026-06-02',
    });

    expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-02T23:59:59.999Z'),
        },
        type: { in: ['landing_visit', 'cv_download', 'contact_submit'] },
      },
      select: { type: true, metadata: true, path: true },
    });
    expect(result).toEqual({
      segments: [
        {
          source: 'linkedin',
          channel: 'social',
          landingVisits: 2,
          cvDownloads: 1,
          contactSubmits: 0,
          cvDownloadRate: 50,
          contactRate: 0,
        },
        {
          source: 'direct',
          channel: 'direct',
          landingVisits: 1,
          cvDownloads: 0,
          contactSubmits: 0,
          cvDownloadRate: 0,
          contactRate: 0,
        },
        {
          source: 'email',
          channel: 'newsletter',
          landingVisits: 0,
          cvDownloads: 0,
          contactSubmits: 1,
          cvDownloadRate: 0,
          contactRate: 0,
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
    analyticsFunnelDefinition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    analyticsGoal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}
