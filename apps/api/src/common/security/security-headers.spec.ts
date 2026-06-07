import { apiSecurityHeaders, setApiSecurityHeaders } from './security-headers';

describe('setApiSecurityHeaders', () => {
  it('applies the API security headers baseline', () => {
    const response = { setHeader: jest.fn() };

    setApiSecurityHeaders(response);

    for (const [name, value] of apiSecurityHeaders) {
      expect(response.setHeader).toHaveBeenCalledWith(name, value);
    }
  });
});
