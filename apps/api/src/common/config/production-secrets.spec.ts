import {
  assertSafeProductionConfig,
  assertSafeProductionSecrets,
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

  it('combines unsafe secrets and runtime config without exposing values', () => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'change-me-access-secret',
      JWT_REFRESH_SECRET: 'real-refresh-secret',
      ADMIN_PASSWORD: 'real-admin-password',
      API_CORS_ORIGIN: 'http://localhost:3000',
    };

    expect(
      unsafeProductionConfigKeys('production', (key) => values[key]),
    ).toEqual(['JWT_ACCESS_SECRET', 'API_CORS_ORIGIN']);
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).toThrow('JWT_ACCESS_SECRET, API_CORS_ORIGIN');
    expect(() =>
      assertSafeProductionConfig('production', (key) => values[key]),
    ).not.toThrow('change-me-access-secret');
  });
});
