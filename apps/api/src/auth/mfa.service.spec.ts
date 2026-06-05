import { MfaService } from './mfa.service';

describe('MfaService', () => {
  const service = new MfaService();

  it('generates and verifies a TOTP code for the same time window', () => {
    const secret = service.generateSecret();
    const counter = Math.floor(Date.now() / 1000 / 30);
    const code = service.generateTotpCode(secret, counter);

    expect(service.verifyTotp(secret, code)).toBe(true);
    expect(service.verifyTotp(secret, 'abcdef')).toBe(false);
  });

  it('generates recovery codes in a readable one-time format', () => {
    const codes = service.generateRecoveryCodes(2);

    expect(codes).toHaveLength(2);
    expect(codes[0]).toMatch(/^[A-F0-9]{8}-[A-F0-9]{8}$/);
  });
});
