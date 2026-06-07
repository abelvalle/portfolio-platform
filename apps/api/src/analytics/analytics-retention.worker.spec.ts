import { ConfigService } from '@nestjs/config';
import { AnalyticsRetentionWorker } from './analytics-retention.worker';
import { AnalyticsService } from './analytics.service';

const createWorker = (
  config: Record<string, string | undefined> = {},
  analyticsService = {
    privacyStatus: jest.fn().mockReturnValue({ retentionDays: 30 }),
    pruneRetention: jest
      .fn()
      .mockResolvedValue({ retentionDays: 30, deleted: 0 }),
  },
) =>
  new AnalyticsRetentionWorker(
    analyticsService as unknown as AnalyticsService,
    {
      get: (key: string) => config[key],
    } as unknown as ConfigService,
  );

describe('AnalyticsRetentionWorker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('prunes analytics retention on the configured interval', async () => {
    const analyticsService = {
      privacyStatus: jest.fn().mockReturnValue({ retentionDays: 30 }),
      pruneRetention: jest
        .fn()
        .mockResolvedValue({ retentionDays: 30, deleted: 2 }),
    };
    const worker = createWorker(
      { ANALYTICS_RETENTION_WORKER_INTERVAL_MS: '60000' },
      analyticsService,
    );

    worker.onModuleInit();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(analyticsService.pruneRetention).toHaveBeenCalledTimes(1);

    worker.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start when retention is not configured', () => {
    const analyticsService = {
      privacyStatus: jest.fn().mockReturnValue({ retentionDays: null }),
      pruneRetention: jest.fn(),
    };
    const worker = createWorker({}, analyticsService);

    worker.onModuleInit();

    expect(jest.getTimerCount()).toBe(0);
    expect(analyticsService.pruneRetention).not.toHaveBeenCalled();
  });

  it('does not start when retention worker is disabled', () => {
    const analyticsService = {
      privacyStatus: jest.fn().mockReturnValue({ retentionDays: 30 }),
      pruneRetention: jest.fn(),
    };
    const worker = createWorker(
      { ANALYTICS_RETENTION_WORKER_ENABLED: 'false' },
      analyticsService,
    );

    worker.onModuleInit();

    expect(jest.getTimerCount()).toBe(0);
    expect(analyticsService.pruneRetention).not.toHaveBeenCalled();
  });
});
