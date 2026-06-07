import { ConfigService } from '@nestjs/config';
import { LinkedinService } from './linkedin.service';

describe('LinkedinService', () => {
  const originalFetch = global.fetch;
  const prisma = {
    profile: {
      findFirst: jest.fn().mockResolvedValue({
        linkedin: 'https://www.linkedin.com/in/abelvros/',
      }),
    },
    integrationAccount: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({
        id: 'integration-linkedin-1',
        provider: 'linkedin',
        lastSyncedAt: new Date('2026-06-07T08:00:00.000Z'),
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
      connected: false,
      lastSyncedAt: null,
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

  it('does not exchange OAuth code when LinkedIn is not configured', async () => {
    const service = new LinkedinService(
      { get: () => undefined } as unknown as ConfigService,
      prisma as never,
    );

    await expect(service.callback('code-123')).resolves.toEqual({
      configured: false,
      status: 'not_configured',
    });
  });

  it('exchanges OAuth code and returns sanitized userinfo', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'linkedin-access-token',
          expires_in: 3600,
          scope: 'openid profile email',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'linkedin-user',
          name: 'Abel Valle Rosa',
          email: 'abel@example.com',
          picture: 'https://media.example.com/abel.jpg',
        }),
      });
    global.fetch = fetchMock as never;

    const service = new LinkedinService(
      configuredLinkedinConfig() as unknown as ConfigService,
      prisma as never,
    );

    const result = await service.callback('code-123', 'state-123');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://www.linkedin.com/oauth/v2/accessToken',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.linkedin.com/v2/userinfo',
      expect.objectContaining({
        headers: { Authorization: 'Bearer linkedin-access-token' },
      }),
    );
    expect(prisma.integrationAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_externalId: {
            provider: 'linkedin',
            externalId: 'linkedin-user',
          },
        },
        create: expect.objectContaining({
          provider: 'linkedin',
          externalId: 'linkedin-user',
          displayName: 'Abel Valle Rosa',
          email: 'abel@example.com',
          pictureUrl: 'https://media.example.com/abel.jpg',
          metadata: {
            state: 'state-123',
            expiresIn: 3600,
            scope: 'openid profile email',
          },
        }),
        update: expect.objectContaining({
          displayName: 'Abel Valle Rosa',
          email: 'abel@example.com',
          pictureUrl: 'https://media.example.com/abel.jpg',
          metadata: {
            state: 'state-123',
            expiresIn: 3600,
            scope: 'openid profile email',
          },
          deletedAt: null,
        }),
      }),
    );
    expect(result).toEqual({
      configured: true,
      status: 'connected',
      state: 'state-123',
      expiresIn: 3600,
      scope: 'openid profile email',
      profile: {
        sub: 'linkedin-user',
        name: 'Abel Valle Rosa',
        email: 'abel@example.com',
        picture: 'https://media.example.com/abel.jpg',
      },
      account: {
        id: 'integration-linkedin-1',
        provider: 'linkedin',
        lastSyncedAt: new Date('2026-06-07T08:00:00.000Z'),
      },
    });
    expect(JSON.stringify(result)).not.toContain('linkedin-access-token');
    expect(
      JSON.stringify(prisma.integrationAccount.upsert.mock.calls),
    ).not.toContain('linkedin-access-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
});

function configuredLinkedinConfig() {
  const values: Record<string, string> = {
    LINKEDIN_CLIENT_ID: 'client-id',
    LINKEDIN_CLIENT_SECRET: 'client-secret',
    LINKEDIN_REDIRECT_URI:
      'https://api.example.com/integrations/linkedin/callback',
  };

  return {
    get: (key: string) => values[key],
  };
}
