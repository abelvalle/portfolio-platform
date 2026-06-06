import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsEventsQueryDto,
  CreateAnalyticsEventDto,
} from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  record(dto: CreateAnalyticsEventDto, ip?: string, userAgent?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        ...dto,
        ipHash: this.hashIp(ip),
        userAgent: this.storeUserAgent() ? userAgent : null,
      },
    });
  }

  privacyStatus() {
    return {
      retentionDays: this.retentionDays(),
      storeUserAgent: this.storeUserAgent(),
      ipHashSaltConfigured: Boolean(
        this.configService.get<string>('ANALYTICS_IP_HASH_SALT'),
      ),
    };
  }

  async pruneRetention(now = new Date()) {
    const retentionDays = this.retentionDays();
    if (!retentionDays) {
      return { retentionDays: null, deleted: 0 };
    }

    const cutoff = new Date(
      now.getTime() - retentionDays * 24 * 60 * 60 * 1000,
    );
    const result = await this.prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return { retentionDays, cutoff, deleted: result.count };
  }

  async summary(filters: AnalyticsDateRangeQueryDto = {}) {
    const dateWhere = this.dateRangeWhere(filters);
    const [totalVisits, cvDownloads, contactSubmits, projectViews] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { ...dateWhere, type: 'landing_visit' },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...dateWhere, type: 'cv_download' },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...dateWhere, type: 'contact_submit' },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...dateWhere, type: 'project_view' },
        }),
      ]);

    return { totalVisits, cvDownloads, contactSubmits, projectViews };
  }

  list(filters: AnalyticsEventsQueryDto = {}) {
    return this.prisma.analyticsEvent.findMany({
      where: this.eventWhere(filters),
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private eventWhere(filters: AnalyticsEventsQueryDto) {
    return {
      ...this.dateRangeWhere(filters),
      ...(filters.type ? { type: filters.type } : {}),
    };
  }

  private dateRangeWhere(
    filters: AnalyticsDateRangeQueryDto,
  ): Prisma.AnalyticsEventWhereInput {
    const from = filters.from ? startOfDayUtc(filters.from) : null;
    const to = filters.to ? endOfDayUtc(filters.to) : null;

    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('Invalid analytics date range');
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (from) {
      createdAt.gte = from;
    }
    if (to) {
      createdAt.lte = to;
    }

    return Object.keys(createdAt).length ? { createdAt } : {};
  }

  private hashIp(ip?: string) {
    if (!ip) {
      return null;
    }

    const salt = this.configService.get<string>('ANALYTICS_IP_HASH_SALT');
    return createHash('sha256')
      .update(salt ? `${salt}:${ip}` : ip)
      .digest('hex');
  }

  private storeUserAgent() {
    return (
      this.configService.get<string>('ANALYTICS_STORE_USER_AGENT') !== 'false'
    );
  }

  private retentionDays() {
    const configured = Number(
      this.configService.get<string>('ANALYTICS_RETENTION_DAYS') || 0,
    );
    return Number.isFinite(configured) && configured > 0 ? configured : null;
  }
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
