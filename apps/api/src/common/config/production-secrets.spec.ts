import {
  assertSafeProductionConfig,
  assertSafeProductionSecrets,
  unsafeProductionContactEmailConfigKeys,
  unsafeProductionConfigKeys,
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

  it('combines unsafe secrets and runtime config without exposing values', () => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'change-me-access-secret',
      JWT_REFRESH_SECRET: 'real-refresh-secret',
      ADMIN_PASSWORD: 'real-admin-password',
      API_CORS_ORIGIN: 'http://localhost:3000',
      CONTACT_EMAIL_PROVIDER: 'generic',
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
    ]);
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).toThrow(
      'JWT_ACCESS_SECRET, API_CORS_ORIGIN, CONTACT_EMAIL_API_URL, CONTACT_EMAIL_API_KEY, CONTACT_EMAIL_FROM, CONTACT_EMAIL_TO',
    );
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).not.toThrow('change-me-access-secret');
  });
});
