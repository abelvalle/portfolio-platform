import { parseCorsOrigins } from './cors.config';

describe('parseCorsOrigins', () => {
  it('uses the local frontend as fallback', () => {
    expect(parseCorsOrigins()).toEqual(['http://localhost:3000']);
    expect(parseCorsOrigins('')).toEqual(['http://localhost:3000']);
  });

  it('trims and filters comma separated origins', () => {
    expect(
      parseCorsOrigins(
        ' http://localhost:3000, https://portfolio.example.com ',
      ),
    ).toEqual(['http://localhost:3000', 'https://portfolio.example.com']);
  });

  it('does not allow wildcard origin with credentialed CORS', () => {
    expect(parseCorsOrigins('*')).toEqual(['http://localhost:3000']);
    expect(parseCorsOrigins('*, https://portfolio.example.com')).toEqual([
      'https://portfolio.example.com',
    ]);
  });
});
