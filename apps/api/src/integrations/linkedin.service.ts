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
    const [profile, account] = await Promise.all([
      this.prisma.profile.findFirst(),
      this.prisma.integrationAccount.findFirst({
        where: { provider: 'linkedin', deletedAt: null },
        orderBy: { lastSyncedAt: 'desc' },
      }),
    ]);
    return {
      configured: this.isOauthConfigured(),
      profileUrl: profile?.linkedin || null,
      scopes: ['openid', 'profile', 'email'],
      shareEnabled: Boolean(profile?.linkedin),
      connected: Boolean(account),
      lastSyncedAt: account?.lastSyncedAt ?? null,
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
    const account = await this.persistProfile(profile, {
      state,
      expiresIn: token.expires_in,
      scope: token.scope,
    });

    return {
      configured: true,
      status: 'connected',
      state: state || null,
      expiresIn: token.expires_in ?? null,
      scope: token.scope ?? null,
      profile,
      account: {
        id: account.id,
        provider: account.provider,
        lastSyncedAt: account.lastSyncedAt,
      },
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

  private persistProfile(
    profile: {
      sub: string | null;
      name: string | null;
      email: string | null;
      picture: string | null;
    },
    metadata: { state?: string; expiresIn?: number; scope?: string },
  ) {
    const externalId = profile.sub || profile.email;
    if (!externalId) {
      throw new BadRequestException(
        'LinkedIn profile missing stable identifier',
      );
    }
    const now = new Date();
    return this.prisma.integrationAccount.upsert({
      where: {
        provider_externalId: {
          provider: 'linkedin',
          externalId,
        },
      },
      create: {
        provider: 'linkedin',
        externalId,
        displayName: profile.name,
        email: profile.email,
        pictureUrl: profile.picture,
        metadata: this.cleanMetadata(metadata),
        connectedAt: now,
        lastSyncedAt: now,
      },
      update: {
        displayName: profile.name,
        email: profile.email,
        pictureUrl: profile.picture,
        metadata: this.cleanMetadata(metadata),
        lastSyncedAt: now,
        deletedAt: null,
      },
    });
  }

  private cleanMetadata(metadata: {
    state?: string;
    expiresIn?: number;
    scope?: string;
  }) {
    return {
      state: metadata.state || null,
      expiresIn: metadata.expiresIn ?? null,
      scope: metadata.scope || null,
    };
  }
}
