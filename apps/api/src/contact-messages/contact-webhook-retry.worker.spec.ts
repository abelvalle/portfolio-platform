import { ConfigService } from '@nestjs/config';
import { ContactWebhookRetryWorker } from './contact-webhook-retry.worker';
import { ContactWebhookService } from './contact-webhook.service';

const createWorker = (
  config: Record<string, string | undefined> = {},
  webhookService = {
    processDueRetries: jest
      .fn()
      .mockResolvedValue({ processed: 0, results: [] }),
  },
) =>
  new ContactWebhookRetryWorker(
    {
      get: (key: string) => config[key],
    } as unknown as ConfigService,
    webhookService as unknown as ContactWebhookService,
  );

describe('ContactWebhookRetryWorker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('processes due retries on the configured interval', async () => {
    const webhookService = {
      processDueRetries: jest
        .fn()
        .mockResolvedValue({ processed: 1, results: [] }),
    };
    const worker = createWorker(
      { CONTACT_WEBHOOK_RETRY_WORKER_INTERVAL_MS: '1000' },
      webhookService,
    );

    worker.onModuleInit();
    await jest.advanceTimersByTimeAsync(1000);

    expect(webhookService.processDueRetries).toHaveBeenCalledTimes(1);

    worker.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start when the worker is disabled', () => {
    const webhookService = {
      processDueRetries: jest.fn(),
    };
    const worker = createWorker(
      { CONTACT_WEBHOOK_RETRY_WORKER_ENABLED: 'false' },
      webhookService,
    );

    worker.onModuleInit();

    expect(jest.getTimerCount()).toBe(0);
    expect(webhookService.processDueRetries).not.toHaveBeenCalled();
  });
});
