import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
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
}
