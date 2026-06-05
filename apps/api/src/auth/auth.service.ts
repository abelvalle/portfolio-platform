import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from './mfa.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mfaService: MfaService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        mfaToken: await this.createMfaToken(user),
        user: this.toPublicUser(user),
      };
    }

    const tokens = await this.createTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash) {
      throw new ForbiddenException('Refresh token not found');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.createTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  async getMfaStatus(userId: string) {
    const user = await this.findUserOrThrow(userId);
    return {
      enabled: user.mfaEnabled,
      confirmedAt: user.mfaConfirmedAt,
      lastUsedAt: user.mfaLastUsedAt,
      recoveryCodesRemaining: user.mfaRecoveryCodeHashes.length,
    };
  }

  async setupMfa(userId: string) {
    const user = await this.findUserOrThrow(userId);
    if (user.mfaEnabled) {
      throw new BadRequestException('Disable MFA before configuring it again');
    }

    const secret = this.mfaService.generateSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: secret,
        mfaConfirmedAt: null,
        mfaRecoveryCodeHashes: [],
      },
    });

    return {
      secret,
      otpauthUrl: this.mfaService.buildOtpAuthUrl(user.email, secret),
    };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.findUserOrThrow(userId);
    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup has not been started');
    }

    if (!this.mfaService.verifyTotp(user.mfaSecret, code)) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const recoveryCodes = this.mfaService.generateRecoveryCodes();
    const recoveryCodeHashes = await Promise.all(
      recoveryCodes.map((recoveryCode) => bcrypt.hash(recoveryCode, 12)),
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaConfirmedAt: new Date(),
        mfaLastUsedAt: new Date(),
        mfaRecoveryCodeHashes: recoveryCodeHashes,
      },
    });

    return {
      enabled: true,
      recoveryCodes,
    };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.findUserOrThrow(userId);
    if (!user.mfaEnabled) {
      return { enabled: false };
    }

    if (!(await this.verifyMfaCode(user, code))) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaConfirmedAt: null,
        mfaLastUsedAt: null,
        mfaRecoveryCodeHashes: [],
      },
    });

    return { enabled: false };
  }

  async verifyMfaLogin(mfaToken: string, code: string) {
    const payload = await this.jwtService
      .verifyAsync<{ sub: string; purpose: string }>(mfaToken, {
        secret: this.getAccessSecret(),
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid MFA challenge');
      });

    if (payload.purpose !== 'mfa_login') {
      throw new UnauthorizedException('Invalid MFA challenge');
    }

    const user = await this.findUserOrThrow(payload.sub);
    if (!user.mfaEnabled || !(await this.verifyMfaCode(user, code))) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaLastUsedAt: new Date() },
    });

    const tokens = await this.createTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  private async createTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
          '15m') as never,
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'change-me-refresh-secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '7d') as never,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private createMfaToken(user: User) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        purpose: 'mfa_login',
      },
      {
        secret: this.getAccessSecret(),
        expiresIn: '5m',
      },
    );
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) },
    });
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    };
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private getAccessSecret() {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'change-me-access-secret'
    );
  }

  private async verifyMfaCode(user: User, code: string) {
    if (user.mfaSecret && this.mfaService.verifyTotp(user.mfaSecret, code)) {
      return true;
    }

    for (const [index, hash] of user.mfaRecoveryCodeHashes.entries()) {
      if (await bcrypt.compare(code, hash)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            mfaRecoveryCodeHashes: user.mfaRecoveryCodeHashes.filter(
              (_, recoveryIndex) => recoveryIndex !== index,
            ),
          },
        });
        return true;
      }
    }

    return false;
  }
}
