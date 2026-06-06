import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_SHARE_URL = 'https://www.linkedin.com/sharing/share-offsite/';

@Injectable()
export class LinkedinService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async status() {
    const profile = await this.prisma.profile.findFirst();
    return {
      configured: this.isOauthConfigured(),
      profileUrl: profile?.linkedin || null,
      scopes: ['openid', 'profile', 'email'],
      shareEnabled: Boolean(profile?.linkedin),
    };
  }

  authUrl(state: string) {
    if (!this.isOauthConfigured()) {
      return { configured: false, url: null };
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.configService.get<string>('LINKEDIN_CLIENT_ID')!,
      redirect_uri: this.configService.get<string>('LINKEDIN_REDIRECT_URI')!,
      state,
      scope: 'openid profile email',
    });

    return { configured: true, url: `${LINKEDIN_AUTH_URL}?${params}` };
  }

  async callback(code?: string, state?: string) {
    if (!this.isOauthConfigured()) {
      return { configured: false, status: 'not_configured' };
    }
    if (!code) {
      throw new BadRequestException('LinkedIn authorization code is required');
    }

    const token = await this.exchangeCode(code);
    const profile = await this.fetchUserInfo(token.access_token);

    return {
      configured: true,
      status: 'connected',
      state: state || null,
      expiresIn: token.expires_in ?? null,
      scope: token.scope ?? null,
      profile,
    };
  }

  shareUrl(path = '/') {
    const baseUrl =
      this.configService.get<string>('PUBLIC_SITE_URL') ||
      'http://localhost:3000';
    const target = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl);
    return {
      url: `${LINKEDIN_SHARE_URL}?url=${encodeURIComponent(target.toString())}`,
      target: target.toString(),
    };
  }

  private isOauthConfigured() {
    return Boolean(
      this.configService.get<string>('LINKEDIN_CLIENT_ID') &&
      this.configService.get<string>('LINKEDIN_CLIENT_SECRET') &&
      this.configService.get<string>('LINKEDIN_REDIRECT_URI'),
    );
  }

  private async exchangeCode(code: string) {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.configService.get<string>('LINKEDIN_REDIRECT_URI')!,
        client_id: this.configService.get<string>('LINKEDIN_CLIENT_ID')!,
        client_secret: this.configService.get<string>(
          'LINKEDIN_CLIENT_SECRET',
        )!,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('LinkedIn token exchange failed');
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
    };
    if (!payload.access_token) {
      throw new BadRequestException(
        'LinkedIn token response missing access token',
      );
    }

    return {
      access_token: payload.access_token,
      expires_in: payload.expires_in,
      scope: payload.scope,
    };
  }

  private async fetchUserInfo(accessToken: string) {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadRequestException('LinkedIn profile sync failed');
    }

    const payload = (await response.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    return {
      sub: payload.sub || null,
      name: payload.name || null,
      email: payload.email || null,
      picture: payload.picture || null,
    };
  }
}
