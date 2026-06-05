import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

@Injectable()
export class MfaService {
  generateSecret() {
    return this.base32Encode(randomBytes(20));
  }

  buildOtpAuthUrl(email: string, secret: string) {
    const issuer = 'Abel Portfolio Platform';
    const label = `${issuer}:${email}`;
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(TOTP_DIGITS),
      period: String(TOTP_STEP_SECONDS),
    });
    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  generateRecoveryCodes(count = 8) {
    return Array.from({ length: count }, () => {
      const first = randomBytes(4).toString('hex').toUpperCase();
      const second = randomBytes(4).toString('hex').toUpperCase();
      return `${first}-${second}`;
    });
  }

  verifyTotp(secret: string, code: string, timestamp = Date.now()) {
    const normalized = code.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalized)) {
      return false;
    }

    const counter = Math.floor(timestamp / 1000 / TOTP_STEP_SECONDS);
    return [-1, 0, 1].some(
      (offset) =>
        this.generateTotpCode(secret, counter + offset) === normalized,
    );
  }

  generateTotpCode(secret: string, counter: number) {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter, 4);

    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
  }

  private base32Encode(buffer: Buffer) {
    let bits = '';
    for (const byte of buffer) {
      bits += byte.toString(2).padStart(8, '0');
    }

    return bits
      .match(/.{1,5}/g)!
      .map((chunk) => BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)])
      .join('');
  }

  private base32Decode(value: string) {
    const normalized = value.toUpperCase().replace(/=+$/g, '');
    let bits = '';
    for (const char of normalized) {
      const index = BASE32_ALPHABET.indexOf(char);
      if (index === -1) {
        throw new Error('Invalid base32 secret');
      }
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes = bits.match(/.{1,8}/g) || [];
    return Buffer.from(
      bytes
        .filter((byte) => byte.length === 8)
        .map((byte) => parseInt(byte, 2)),
    );
  }
}
