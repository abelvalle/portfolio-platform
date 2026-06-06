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
    const { source, channel, ...event } = dto;
    return this.prisma.analyticsEvent.create({
      data: {
        ...event,
        metadata: this.attributionMetadata({ ...event, source, channel }),
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

  async timeSeries(filters: AnalyticsEventsQueryDto = {}) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: this.eventWhere(filters),
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });
    const byDay = this.seedTimeSeries(filters);

    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const point = byDay.get(date) || {
        date,
        total: 0,
        types: new Map<string, number>(),
      };
      point.total += 1;
      point.types.set(event.type, (point.types.get(event.type) || 0) + 1);
      byDay.set(date, point);
    }

    return [...byDay.values()]
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((point) => ({
        date: point.date,
        total: point.total,
        types: Object.fromEntries(point.types.entries()),
      }));
  }

  async channels(filters: AnalyticsEventsQueryDto = {}) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: this.eventWhere(filters),
      select: { metadata: true, path: true },
    });
    const sources = new Map<string, number>();
    const channels = new Map<string, number>();

    for (const event of events) {
      const attribution = this.resolveAttribution(event.metadata, event.path);
      sources.set(
        attribution.source,
        (sources.get(attribution.source) || 0) + 1,
      );
      channels.set(
        attribution.channel,
        (channels.get(attribution.channel) || 0) + 1,
      );
    }

    return {
      sources: this.topSegments(sources),
      channels: this.topSegments(channels),
    };
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

  private seedTimeSeries(filters: AnalyticsDateRangeQueryDto) {
    const byDay = new Map<
      string,
      { date: string; total: number; types: Map<string, number> }
    >();
    const from = filters.from ? startOfDayUtc(filters.from) : null;
    const to = filters.to ? startOfDayUtc(filters.to) : null;

    if (!from || !to) {
      return byDay;
    }

    for (
      const cursor = new Date(from);
      cursor.getTime() <= to.getTime();
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const date = cursor.toISOString().slice(0, 10);
      byDay.set(date, { date, total: 0, types: new Map() });
    }

    return byDay;
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

  private attributionMetadata(dto: CreateAnalyticsEventDto) {
    const attribution = this.resolveAttribution(
      { source: dto.source, channel: dto.channel },
      dto.path,
    );
    return attribution as never;
  }

  private resolveAttribution(metadata: unknown, path?: string | null) {
    const record = this.metadataRecord(metadata);
    const pathParams = this.pathSearchParams(path);
    const source =
      this.cleanSegment(record.source) ||
      this.cleanSegment(pathParams.get('utm_source')) ||
      this.cleanSegment(pathParams.get('source')) ||
      'direct';
    const channel =
      this.cleanSegment(record.channel) ||
      this.cleanSegment(pathParams.get('utm_medium')) ||
      (source === 'direct' ? 'direct' : 'referral');

    return { source, channel };
  }

  private pathSearchParams(path?: string | null) {
    try {
      return new URL(path || '/', 'https://portfolio.local').searchParams;
    } catch {
      return new URLSearchParams();
    }
  }

  private cleanSegment(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? value.trim().toLowerCase().slice(0, 80)
      : null;
  }

  private metadataRecord(metadata: unknown): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return {};
  }

  private topSegments(segments: Map<string, number>) {
    return [...segments.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.name.localeCompare(right.name),
      )
      .slice(0, 8);
  }
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
