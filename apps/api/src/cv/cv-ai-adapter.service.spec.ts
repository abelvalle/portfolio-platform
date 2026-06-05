import { ConfigService } from '@nestjs/config';
import { CvAiAdapterService } from './cv-ai-adapter.service';

describe('CvAiAdapterService', () => {
  it('returns null when no optional AI adapter URL is configured', async () => {
    const service = new CvAiAdapterService({
      get: () => undefined,
    } as unknown as ConfigService);

    await expect(
      service.propose({
        targetRole: 'Delivery Manager',
        jobDescription: 'Delivery, KPIs, UAT and stakeholders',
        keywords: ['delivery'],
        source: {},
      }),
    ).resolves.toBeNull();
  });
});
