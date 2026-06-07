const defaultCorsOrigin = 'http://localhost:3000';

export function parseCorsOrigins(rawValue?: string | null) {
  const origins = (rawValue || defaultCorsOrigin)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');

  return origins.length > 0 ? origins : [defaultCorsOrigin];
}
