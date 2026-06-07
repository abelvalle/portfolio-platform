import { isSwaggerEnabled } from './swagger.config';

describe('isSwaggerEnabled', () => {
  it('is enabled by default outside production', () => {
    expect(isSwaggerEnabled('development')).toBe(true);
    expect(isSwaggerEnabled(undefined)).toBe(true);
  });

  it('is disabled by default in production', () => {
    expect(isSwaggerEnabled('production')).toBe(false);
  });

  it('honors explicit env overrides', () => {
    expect(isSwaggerEnabled('production', 'true')).toBe(true);
    expect(isSwaggerEnabled('development', 'false')).toBe(false);
    expect(isSwaggerEnabled('development', '0')).toBe(false);
    expect(isSwaggerEnabled('development', 'off')).toBe(false);
  });
});
