const disabledValues = new Set(['false', '0', 'off', 'disabled', 'no']);

export function isSwaggerEnabled(
  nodeEnv?: string,
  rawValue?: string | boolean | number | null,
) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return nodeEnv !== 'production';
  }

  return !disabledValues.has(String(rawValue).trim().toLowerCase());
}
