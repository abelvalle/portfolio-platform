export const productionSecretKeys = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ADMIN_PASSWORD',
] as const;

const insecureValues = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'changeme123!',
  'change-me',
]);

type SecretLookup = (key: string) => string | null | undefined;

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
