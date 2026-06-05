import { ConfigService } from '@nestjs/config';
import { LinkedinService } from './linkedin.service';

describe('LinkedinService', () => {
  const prisma = {
    profile: {
      findFirst: jest.fn().mockResolvedValue({
        linkedin: 'https://www.linkedin.com/in/abelvros/',
      }),
    },
  };

  it('reports OAuth as not configured without secrets', async () => {
    const service = new LinkedinService(
      { get: () => undefined } as unknown as ConfigService,
      prisma as never,
    );

    await expect(service.status()).resolves.toMatchObject({
      configured: false,
      profileUrl: 'https://www.linkedin.com/in/abelvros/',
      shareEnabled: true,
    });
  });

  it('builds a LinkedIn share URL for a local path', () => {
    const service = new LinkedinService(
      {
        get: (key: string) =>
          key === 'PUBLIC_SITE_URL'
            ? 'https://portfolio.example.com'
            : undefined,
      } as unknown as ConfigService,
      prisma as never,
    );

    expect(service.shareUrl('/cv').target).toBe(
      'https://portfolio.example.com/cv',
    );
    expect(service.shareUrl('/cv').url).toContain(
      'linkedin.com/sharing/share-offsite',
    );
  });
});
