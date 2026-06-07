import { parseCorsOrigins } from './cors.config';

export const productionSecretKeys = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ADMIN_PASSWORD',
] as const;

export const productionRuntimeConfigKeys = ['API_CORS_ORIGIN'] as const;

const insecureValues = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'changeme123!',
  'change-me',
]);

type SecretLookup = (key: string) => string | null | undefined;

function isLocalOrigin(origin: string) {
  const normalized = origin.trim().toLowerCase();
  return (
    normalized.startsWith('http://localhost') ||
    normalized.startsWith('https://localhost') ||
    normalized.startsWith('http://127.') ||
    normalized.startsWith('https://127.') ||
    normalized.startsWith('http://[::1]') ||
    normalized.startsWith('https://[::1]')
  );
}

export function unsafeProductionSecretKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  return productionSecretKeys.filter((key) => {
    const value = lookup(key);
    return !value || insecureValues.has(value.trim().toLowerCase());
  });
}

export function assertSafeProductionSecrets(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  const unsafeKeys = unsafeProductionSecretKeys(nodeEnv, lookup);

  if (unsafeKeys.length > 0) {
    throw new Error(
      `Unsafe production configuration: replace placeholder values for ${unsafeKeys.join(', ')}`,
    );
  }
}

export function unsafeProductionRuntimeConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  const rawCorsOrigin = lookup('API_CORS_ORIGIN');
  const corsOrigins = parseCorsOrigins(rawCorsOrigin);
  const hasLocalOrigin = corsOrigins.some(isLocalOrigin);

  return !rawCorsOrigin || hasLocalOrigin
    ? [...productionRuntimeConfigKeys]
    : [];
}

export function unsafeProductionConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  return [
    ...unsafeProductionSecretKeys(nodeEnv, lookup),
    ...unsafeProductionRuntimeConfigKeys(nodeEnv, lookup),
  ];
}

export function assertSafeProductionConfig(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  const unsafeKeys = unsafeProductionConfigKeys(nodeEnv, lookup);

  if (unsafeKeys.length > 0) {
    throw new Error(
      `Unsafe production configuration: replace placeholder or local-only values for ${unsafeKeys.join(', ')}`,
    );
  }
}
