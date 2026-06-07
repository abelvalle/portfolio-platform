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

const disabledContactEmailProviders = new Set(['', 'disabled', 'none']);
const supportedContactEmailProviders = new Set(['resend', 'generic']);

type SecretLookup = (key: string) => string | null | undefined;

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

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

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

export function unsafeProductionContactEmailConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  const provider = (lookup('CONTACT_EMAIL_PROVIDER') || '')
    .trim()
    .toLowerCase();

  if (disabledContactEmailProviders.has(provider)) {
    return [];
  }

  if (!supportedContactEmailProviders.has(provider)) {
    return ['CONTACT_EMAIL_PROVIDER'];
  }

  const requiredKeys = [
    ...(provider === 'generic' ? ['CONTACT_EMAIL_API_URL'] : []),
    'CONTACT_EMAIL_API_KEY',
    'CONTACT_EMAIL_FROM',
    'CONTACT_EMAIL_TO',
  ];

  return requiredKeys.filter((key) => !hasValue(lookup(key)));
}

export function unsafeProductionContactWebhookConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  const webhookUrl = lookup('CONTACT_WEBHOOK_URL')?.trim() || '';
  if (!webhookUrl) {
    return [];
  }

  const unsafeKeys: string[] = [];
  if (!isValidHttpUrl(webhookUrl) || isLocalOrigin(webhookUrl)) {
    unsafeKeys.push('CONTACT_WEBHOOK_URL');
  }
  if (!hasValue(lookup('CONTACT_WEBHOOK_SECRET'))) {
    unsafeKeys.push('CONTACT_WEBHOOK_SECRET');
  }
  return unsafeKeys;
}

export function unsafeProductionMediaConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  const unsafeKeys: string[] = [];
  const provider = (lookup('MEDIA_STORAGE_PROVIDER') || 'local')
    .trim()
    .toLowerCase();
  if (provider !== 'local') {
    unsafeKeys.push('MEDIA_STORAGE_PROVIDER');
  }

  const externalScanEnabled = lookup('MEDIA_EXTERNAL_SCAN_ENABLED') !== 'false';
  const externalScanUrl = lookup('MEDIA_EXTERNAL_SCAN_URL')?.trim() || '';
  if (
    externalScanEnabled &&
    externalScanUrl &&
    (!isValidHttpUrl(externalScanUrl) || isLocalOrigin(externalScanUrl))
  ) {
    unsafeKeys.push('MEDIA_EXTERNAL_SCAN_URL');
  }

  return unsafeKeys;
}

export function unsafeProductionLinkedinConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  if (nodeEnv !== 'production') {
    return [];
  }

  const clientId = lookup('LINKEDIN_CLIENT_ID')?.trim() || '';
  const clientSecret = lookup('LINKEDIN_CLIENT_SECRET')?.trim() || '';
  if (!clientId && !clientSecret) {
    return [];
  }

  const redirectUri = lookup('LINKEDIN_REDIRECT_URI')?.trim() || '';
  const unsafeKeys: string[] = [];
  if (!clientId) {
    unsafeKeys.push('LINKEDIN_CLIENT_ID');
  }
  if (!clientSecret) {
    unsafeKeys.push('LINKEDIN_CLIENT_SECRET');
  }
  if (
    !redirectUri ||
    !isValidHttpUrl(redirectUri) ||
    isLocalOrigin(redirectUri)
  ) {
    unsafeKeys.push('LINKEDIN_REDIRECT_URI');
  }
  return unsafeKeys;
}

export function unsafeProductionConfigKeys(
  nodeEnv: string | undefined,
  lookup: SecretLookup,
) {
  return [
    ...unsafeProductionSecretKeys(nodeEnv, lookup),
    ...unsafeProductionRuntimeConfigKeys(nodeEnv, lookup),
    ...unsafeProductionContactEmailConfigKeys(nodeEnv, lookup),
    ...unsafeProductionContactWebhookConfigKeys(nodeEnv, lookup),
    ...unsafeProductionMediaConfigKeys(nodeEnv, lookup),
    ...unsafeProductionLinkedinConfigKeys(nodeEnv, lookup),
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
