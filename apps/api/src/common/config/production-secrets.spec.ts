import {
  assertSafeProductionConfig,
  assertSafeProductionSecrets,
  unsafeProductionContactEmailConfigKeys,
  unsafeProductionContactWebhookConfigKeys,
  unsafeProductionConfigKeys,
  unsafeProductionLinkedinConfigKeys,
  unsafeProductionMediaConfigKeys,
  unsafeProductionRuntimeConfigKeys,
  unsafeProductionSecretKeys,
} from './production-secrets';

describe('production secrets guard', () => {
  it('does not enforce placeholders outside production', () => {
    const unsafeKeys = unsafeProductionSecretKeys('development', () => '');

    expect(unsafeKeys).toEqual([]);
  });

  it('finds missing and placeholder production values', () => {
    const values: Record<string, string | undefined> = {
      JWT_ACCESS_SECRET: 'change-me-access-secret',
      JWT_REFRESH_SECRET: undefined,
      ADMIN_PASSWORD: 'ChangeMe123!',
    };

    expect(
      unsafeProductionSecretKeys('production', (key) => values[key]),
    ).toEqual(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_PASSWORD']);
  });

  it('does not expose secret values in the thrown error', () => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'change-me-access-secret',
      JWT_REFRESH_SECRET: 'real-refresh-secret',
      ADMIN_PASSWORD: 'real-admin-password',
    };

    expect(() =>
      assertSafeProductionSecrets('production', (key) => values[key]),
    ).toThrow('JWT_ACCESS_SECRET');
    expect(() =>
      assertSafeProductionSecrets('production', (key) => values[key]),
    ).not.toThrow('change-me-access-secret');
  });

  it('requires explicit non-local CORS origins in production', () => {
    expect(unsafeProductionRuntimeConfigKeys('production', () => '')).toEqual([
      'API_CORS_ORIGIN',
    ]);
    expect(
      unsafeProductionRuntimeConfigKeys(
        'production',
        () => 'http://localhost:3000',
      ),
    ).toEqual(['API_CORS_ORIGIN']);
    expect(
      unsafeProductionRuntimeConfigKeys(
        'production',
        () => 'https://portfolio.example.com',
      ),
    ).toEqual([]);
    expect(
      unsafeProductionRuntimeConfigKeys(
        'production',
        () => 'https://portfolio.example.com,http://127.0.0.1:3000',
      ),
    ).toEqual(['API_CORS_ORIGIN']);
  });

  it('allows disabled contact email notifications in production', () => {
    expect(
      unsafeProductionContactEmailConfigKeys('production', () => undefined),
    ).toEqual([]);
    expect(
      unsafeProductionContactEmailConfigKeys('production', () => 'disabled'),
    ).toEqual([]);
    expect(
      unsafeProductionContactEmailConfigKeys('development', () => 'resend'),
    ).toEqual([]);
  });

  it('requires contact email settings when a provider is enabled', () => {
    const resendValues: Record<string, string | undefined> = {
      CONTACT_EMAIL_PROVIDER: 'resend',
      CONTACT_EMAIL_API_KEY: 'resend-api-key',
      CONTACT_EMAIL_FROM: 'Portfolio <hello@example.com>',
      CONTACT_EMAIL_TO: 'abel@example.com',
    };

    expect(
      unsafeProductionContactEmailConfigKeys(
        'production',
        (key) => resendValues[key],
      ),
    ).toEqual([]);

    const missingValues: Record<string, string | undefined> = {
      CONTACT_EMAIL_PROVIDER: 'resend',
      CONTACT_EMAIL_FROM: 'Portfolio <hello@example.com>',
    };

    expect(
      unsafeProductionContactEmailConfigKeys(
        'production',
        (key) => missingValues[key],
      ),
    ).toEqual(['CONTACT_EMAIL_API_KEY', 'CONTACT_EMAIL_TO']);
  });

  it('requires an explicit api url for generic contact email providers', () => {
    const values: Record<string, string | undefined> = {
      CONTACT_EMAIL_PROVIDER: 'generic',
      CONTACT_EMAIL_API_KEY: 'generic-api-key',
      CONTACT_EMAIL_FROM: 'Portfolio <hello@example.com>',
      CONTACT_EMAIL_TO: 'abel@example.com',
    };

    expect(
      unsafeProductionContactEmailConfigKeys(
        'production',
        (key) => values[key],
      ),
    ).toEqual(['CONTACT_EMAIL_API_URL']);
  });

  it('rejects unsupported contact email providers in production', () => {
    expect(
      unsafeProductionContactEmailConfigKeys('production', () => 'mailgun'),
    ).toEqual(['CONTACT_EMAIL_PROVIDER']);
  });

  it('allows contact webhooks to remain disabled in production', () => {
    expect(
      unsafeProductionContactWebhookConfigKeys('production', () => undefined),
    ).toEqual([]);
    expect(
      unsafeProductionContactWebhookConfigKeys(
        'development',
        () => 'http://localhost:3000/webhook',
      ),
    ).toEqual([]);
  });

  it('requires a signed non-local contact webhook url in production', () => {
    const safeValues: Record<string, string | undefined> = {
      CONTACT_WEBHOOK_URL: 'https://hooks.example.com/contact',
      CONTACT_WEBHOOK_SECRET: 'webhook-secret',
    };

    expect(
      unsafeProductionContactWebhookConfigKeys(
        'production',
        (key) => safeValues[key],
      ),
    ).toEqual([]);

    const missingSecretValues: Record<string, string | undefined> = {
      CONTACT_WEBHOOK_URL: 'https://hooks.example.com/contact',
    };

    expect(
      unsafeProductionContactWebhookConfigKeys(
        'production',
        (key) => missingSecretValues[key],
      ),
    ).toEqual(['CONTACT_WEBHOOK_SECRET']);
  });

  it('rejects local or invalid contact webhook urls in production', () => {
    const localValues: Record<string, string | undefined> = {
      CONTACT_WEBHOOK_URL: 'http://localhost:3000/webhook',
      CONTACT_WEBHOOK_SECRET: 'webhook-secret',
    };
    const invalidValues: Record<string, string | undefined> = {
      CONTACT_WEBHOOK_URL: 'not-a-url',
      CONTACT_WEBHOOK_SECRET: 'webhook-secret',
    };

    expect(
      unsafeProductionContactWebhookConfigKeys(
        'production',
        (key) => localValues[key],
      ),
    ).toEqual(['CONTACT_WEBHOOK_URL']);
    expect(
      unsafeProductionContactWebhookConfigKeys(
        'production',
        (key) => invalidValues[key],
      ),
    ).toEqual(['CONTACT_WEBHOOK_URL']);
  });

  it('allows implemented local media storage in production', () => {
    expect(
      unsafeProductionMediaConfigKeys('production', () => undefined),
    ).toEqual([]);
    expect(
      unsafeProductionMediaConfigKeys('production', (key) =>
        key === 'MEDIA_STORAGE_PROVIDER' ? 'local' : undefined,
      ),
    ).toEqual([]);
    expect(unsafeProductionMediaConfigKeys('development', () => 's3')).toEqual(
      [],
    );
  });

  it('rejects unimplemented media storage providers in production', () => {
    expect(
      unsafeProductionMediaConfigKeys('production', (key) =>
        key === 'MEDIA_STORAGE_PROVIDER' ? 's3' : undefined,
      ),
    ).toEqual(['MEDIA_STORAGE_PROVIDER']);
  });

  it('rejects local or invalid external media scanner urls in production', () => {
    const localValues: Record<string, string | undefined> = {
      MEDIA_STORAGE_PROVIDER: 'local',
      MEDIA_EXTERNAL_SCAN_ENABLED: 'true',
      MEDIA_EXTERNAL_SCAN_URL: 'http://127.0.0.1:8080/scan',
    };
    const invalidValues: Record<string, string | undefined> = {
      MEDIA_STORAGE_PROVIDER: 'local',
      MEDIA_EXTERNAL_SCAN_ENABLED: 'true',
      MEDIA_EXTERNAL_SCAN_URL: 'not-a-url',
    };

    expect(
      unsafeProductionMediaConfigKeys('production', (key) => localValues[key]),
    ).toEqual(['MEDIA_EXTERNAL_SCAN_URL']);
    expect(
      unsafeProductionMediaConfigKeys(
        'production',
        (key) => invalidValues[key],
      ),
    ).toEqual(['MEDIA_EXTERNAL_SCAN_URL']);
  });

  it('allows disabled or external media scanner urls in production', () => {
    const disabledValues: Record<string, string | undefined> = {
      MEDIA_STORAGE_PROVIDER: 'local',
      MEDIA_EXTERNAL_SCAN_ENABLED: 'false',
      MEDIA_EXTERNAL_SCAN_URL: 'not-a-url',
    };
    const safeValues: Record<string, string | undefined> = {
      MEDIA_STORAGE_PROVIDER: 'local',
      MEDIA_EXTERNAL_SCAN_ENABLED: 'true',
      MEDIA_EXTERNAL_SCAN_URL: 'https://scanner.example.com/scan',
    };

    expect(
      unsafeProductionMediaConfigKeys(
        'production',
        (key) => disabledValues[key],
      ),
    ).toEqual([]);
    expect(
      unsafeProductionMediaConfigKeys('production', (key) => safeValues[key]),
    ).toEqual([]);
  });

  it('allows LinkedIn OAuth to remain disabled in production', () => {
    expect(
      unsafeProductionLinkedinConfigKeys('production', () => undefined),
    ).toEqual([]);
    expect(
      unsafeProductionLinkedinConfigKeys('production', (key) =>
        key === 'LINKEDIN_REDIRECT_URI'
          ? 'http://localhost:4000/api/v1/integrations/linkedin/callback'
          : undefined,
      ),
    ).toEqual([]);
  });

  it('requires complete LinkedIn credentials when OAuth is enabled', () => {
    const values: Record<string, string | undefined> = {
      LINKEDIN_CLIENT_ID: 'client-id',
      LINKEDIN_REDIRECT_URI:
        'https://api.example.com/api/v1/integrations/linkedin/callback',
    };

    expect(
      unsafeProductionLinkedinConfigKeys('production', (key) => values[key]),
    ).toEqual(['LINKEDIN_CLIENT_SECRET']);
  });

  it('rejects local or invalid LinkedIn redirect URIs in production', () => {
    const localValues: Record<string, string | undefined> = {
      LINKEDIN_CLIENT_ID: 'client-id',
      LINKEDIN_CLIENT_SECRET: 'client-secret',
      LINKEDIN_REDIRECT_URI:
        'http://localhost:4000/api/v1/integrations/linkedin/callback',
    };
    const invalidValues: Record<string, string | undefined> = {
      LINKEDIN_CLIENT_ID: 'client-id',
      LINKEDIN_CLIENT_SECRET: 'client-secret',
      LINKEDIN_REDIRECT_URI: 'not-a-url',
    };

    expect(
      unsafeProductionLinkedinConfigKeys(
        'production',
        (key) => localValues[key],
      ),
    ).toEqual(['LINKEDIN_REDIRECT_URI']);
    expect(
      unsafeProductionLinkedinConfigKeys(
        'production',
        (key) => invalidValues[key],
      ),
    ).toEqual(['LINKEDIN_REDIRECT_URI']);
  });

  it('allows complete LinkedIn OAuth settings in production', () => {
    const values: Record<string, string | undefined> = {
      LINKEDIN_CLIENT_ID: 'client-id',
      LINKEDIN_CLIENT_SECRET: 'client-secret',
      LINKEDIN_REDIRECT_URI:
        'https://api.example.com/api/v1/integrations/linkedin/callback',
    };

    expect(
      unsafeProductionLinkedinConfigKeys('production', (key) => values[key]),
    ).toEqual([]);
  });

  it('combines unsafe secrets and runtime config without exposing values', () => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'change-me-access-secret',
      JWT_REFRESH_SECRET: 'real-refresh-secret',
      ADMIN_PASSWORD: 'real-admin-password',
      API_CORS_ORIGIN: 'http://localhost:3000',
      CONTACT_EMAIL_PROVIDER: 'generic',
      CONTACT_WEBHOOK_URL: 'http://localhost:4000/webhook',
      MEDIA_STORAGE_PROVIDER: 's3',
      MEDIA_EXTERNAL_SCAN_URL: 'http://127.0.0.1:8080/scan',
      LINKEDIN_CLIENT_ID: 'client-id',
      LINKEDIN_REDIRECT_URI:
        'http://localhost:4000/api/v1/integrations/linkedin/callback',
    };

    expect(
      unsafeProductionConfigKeys('production', (key) => values[key]),
    ).toEqual([
      'JWT_ACCESS_SECRET',
      'API_CORS_ORIGIN',
      'CONTACT_EMAIL_API_URL',
      'CONTACT_EMAIL_API_KEY',
      'CONTACT_EMAIL_FROM',
      'CONTACT_EMAIL_TO',
      'CONTACT_WEBHOOK_URL',
      'CONTACT_WEBHOOK_SECRET',
      'MEDIA_STORAGE_PROVIDER',
      'MEDIA_EXTERNAL_SCAN_URL',
      'LINKEDIN_CLIENT_SECRET',
      'LINKEDIN_REDIRECT_URI',
    ]);
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).toThrow(
      'JWT_ACCESS_SECRET, API_CORS_ORIGIN, CONTACT_EMAIL_API_URL, CONTACT_EMAIL_API_KEY, CONTACT_EMAIL_FROM, CONTACT_EMAIL_TO, CONTACT_WEBHOOK_URL, CONTACT_WEBHOOK_SECRET, MEDIA_STORAGE_PROVIDER, MEDIA_EXTERNAL_SCAN_URL, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI',
    );
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).not.toThrow('change-me-access-secret');
  });
});
