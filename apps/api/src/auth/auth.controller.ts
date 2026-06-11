import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  LoginDto,
  MfaCodeDto,
  RefreshTokenDto,
  VerifyMfaLoginDto,
} from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    if ('accessToken' in result) {
      this.writeAuthCookies(response, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('mfa/verify-login')
  async verifyMfaLogin(
    @Body() body: VerifyMfaLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyMfaLogin(
      body.mfaToken,
      body.code,
    );
    this.writeAuthCookies(response, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const decoded = JSON.parse(
      Buffer.from(body.refreshToken.split('.')[1], 'base64url').toString(
        'utf8',
      ),
    );
    const result = await this.authService.refresh(
      decoded.sub,
      body.refreshToken,
    );
    this.writeAuthCookies(response, result.accessToken, result.refreshToken);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('accessToken', this.cookieOptions());
    response.clearCookie('refreshToken', this.cookieOptions());
    return this.authService.logout(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mfa/status')
  mfaStatus(@CurrentUser() user: { id: string }) {
    return this.authService.getMfaStatus(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: { id: string }) {
    return this.authService.setupMfa(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mfa/confirm')
  confirmMfa(@CurrentUser() user: { id: string }, @Body() body: MfaCodeDto) {
    return this.authService.confirmMfa(user.id, body.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  disableMfa(@CurrentUser() user: { id: string }, @Body() body: MfaCodeDto) {
    return this.authService.disableMfa(user.id, body.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mfa/recovery-codes/regenerate')
  regenerateMfaRecoveryCodes(
    @CurrentUser() user: { id: string },
    @Body() body: MfaCodeDto,
  ) {
    return this.authService.regenerateMfaRecoveryCodes(user.id, body.code);
  }

  private writeAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie('accessToken', accessToken, {
      ...this.cookieOptions(),
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('refreshToken', refreshToken, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };
  }
}
