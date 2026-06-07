import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsEventsQueryDto,
  AnalyticsFunnelQueryDto,
  CreateAnalyticsFunnelDefinitionDto,
  CreateAnalyticsEventDto,
  UpdateAnalyticsFunnelDefinitionDto,
} from './analytics.dto';

type AnalyticsEventInput = CreateAnalyticsEventDto & {
  context?: Record<string, string | null | undefined>;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  record(dto: AnalyticsEventInput, ip?: string, userAgent?: string) {
    const { source, channel, context, ...event } = dto;
    return this.prisma.analyticsEvent.create({
      data: {
        ...event,
        metadata: this.attributionMetadata({
          ...event,
          source,
          channel,
          context,
        }),
        ipHash: this.hashIp(ip),
        userAgent: this.storeUserAgent() ? userAgent : null,
      },
    });
  }

  privacyStatus() {
    const retentionDays = this.retentionDays();
    const retentionWorker = this.retentionWorkerStatus(retentionDays);
    return {
      retentionDays,
      storeUserAgent: this.storeUserAgent(),
      ipHashSaltConfigured: Boolean(
        this.configService.get<string>('ANALYTICS_IP_HASH_SALT'),
      ),
      retentionWorkerEnabled: retentionWorker.enabled,
      retentionWorkerIntervalMs: retentionWorker.intervalMs,
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

  async exportCsv(filters: AnalyticsEventsQueryDto = {}) {
    const events = await this.list(filters);
    const rows = [
      ['type', 'path', 'label', 'createdAt'],
      ...events.map((event) => [
        event.type,
        event.path || '',
        event.label || '',
        event.createdAt.toISOString(),
      ]),
    ];
    return rows.map((row) => row.map(csvCell).join(',')).join('\n');
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

  async labels(filters: AnalyticsEventsQueryDto = {}) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: this.eventWhere(filters),
      select: { label: true, path: true, metadata: true },
    });
    const labels = new Map<string, number>();
    const paths = new Map<string, number>();
    const contexts = new Map<string, number>();

    for (const event of events) {
      const label = this.cleanLabel(event.label) || 'sin_etiqueta';
      const path = this.cleanPath(event.path) || 'sin_ruta';
      const context = this.contextSegment(event.metadata);
      labels.set(label, (labels.get(label) || 0) + 1);
      paths.set(path, (paths.get(path) || 0) + 1);
      if (context) {
        contexts.set(context, (contexts.get(context) || 0) + 1);
      }
    }

    return {
      labels: this.topSegments(labels),
      paths: this.topSegments(paths),
      contexts: this.topSegments(contexts),
    };
  }

  async funnel(filters: AnalyticsFunnelQueryDto = {}) {
    if (filters.steps) {
      return this.customFunnel(filters);
    }

    const summary = await this.summary(filters);
    const steps = [
      {
        key: 'landing_visit',
        label: 'Visitas landing',
        count: summary.totalVisits,
      },
      {
        key: 'cv_download',
        label: 'Descargas CV',
        count: summary.cvDownloads,
      },
      {
        key: 'contact_submit',
        label: 'Formularios contacto',
        count: summary.contactSubmits,
      },
    ];
    const firstCount = steps[0].count;

    return {
      steps: steps.map((step, index) => ({
        ...step,
        rateFromStart: this.percent(step.count, firstCount),
        rateFromPrevious:
          index === 0
            ? this.percent(step.count, firstCount)
            : this.percent(step.count, steps[index - 1].count),
      })),
    };
  }

  funnelDefinitions(includeHidden = false) {
    return this.prisma.analyticsFunnelDefinition.findMany({
      where: {
        deletedAt: null,
        ...(includeHidden ? {} : { visible: true }),
      },
      orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  createFunnelDefinition(dto: CreateAnalyticsFunnelDefinitionDto) {
    return this.prisma.analyticsFunnelDefinition.create({
      data: {
        key: dto.key.trim(),
        name: dto.name.trim(),
        description: this.optionalTrim(dto.description),
        steps: this.funnelStepKeys(dto.steps),
        visible: dto.visible ?? true,
        order: dto.order ?? 0,
      },
    });
  }

  async updateFunnelDefinition(
    id: string,
    dto: UpdateAnalyticsFunnelDefinitionDto,
  ) {
    await this.findFunnelDefinition(id);
    return this.prisma.analyticsFunnelDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: this.optionalTrim(dto.description) }
          : {}),
        ...(dto.steps !== undefined
          ? { steps: this.funnelStepKeys(dto.steps) }
          : {}),
        ...(dto.visible !== undefined ? { visible: dto.visible } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async removeFunnelDefinition(id: string) {
    await this.findFunnelDefinition(id);
    return this.prisma.analyticsFunnelDefinition.update({
      where: { id },
      data: { deletedAt: new Date(), visible: false },
    });
  }

  private async customFunnel(filters: AnalyticsFunnelQueryDto) {
    const steps = this.funnelStepDefinitions(filters.steps);
    const dateWhere = this.dateRangeWhere(filters);
    const counts = await Promise.all(
      steps.map((step) =>
        this.prisma.analyticsEvent.count({
          where: { ...dateWhere, type: step.key },
        }),
      ),
    );
    const firstCount = counts[0] || 0;

    return {
      steps: steps.map((step, index) => ({
        ...step,
        count: counts[index],
        rateFromStart: this.percent(counts[index], firstCount),
        rateFromPrevious:
          index === 0
            ? this.percent(counts[index], firstCount)
            : this.percent(counts[index], counts[index - 1]),
      })),
    };
  }

  async channelFunnel(filters: AnalyticsDateRangeQueryDto = {}) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        ...this.dateRangeWhere(filters),
        type: { in: ['landing_visit', 'cv_download', 'contact_submit'] },
      },
      select: { type: true, metadata: true, path: true },
    });
    const segments = new Map<
      string,
      {
        source: string;
        channel: string;
        landingVisits: number;
        cvDownloads: number;
        contactSubmits: number;
      }
    >();

    for (const event of events) {
      const attribution = this.resolveAttribution(event.metadata, event.path);
      const key = `${attribution.source}|${attribution.channel}`;
      const segment = segments.get(key) || {
        source: attribution.source,
        channel: attribution.channel,
        landingVisits: 0,
        cvDownloads: 0,
        contactSubmits: 0,
      };
      if (event.type === 'landing_visit') {
        segment.landingVisits += 1;
      }
      if (event.type === 'cv_download') {
        segment.cvDownloads += 1;
      }
      if (event.type === 'contact_submit') {
        segment.contactSubmits += 1;
      }
      segments.set(key, segment);
    }

    return {
      segments: [...segments.values()]
        .map((segment) => ({
          ...segment,
          cvDownloadRate: this.percent(
            segment.cvDownloads,
            segment.landingVisits,
          ),
          contactRate: this.percent(
            segment.contactSubmits,
            segment.landingVisits,
          ),
        }))
        .sort(
          (left, right) =>
            right.landingVisits - left.landingVisits ||
            right.cvDownloads - left.cvDownloads ||
            left.source.localeCompare(right.source),
        )
        .slice(0, 8),
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

  private funnelStepDefinitions(steps?: string) {
    const keys = steps
      ?.split(',')
      .map((step) => step.trim())
      .filter(Boolean);

    if (!keys || keys.length < 2 || keys.length > 6) {
      throw new BadRequestException('Analytics funnel requires 2 to 6 steps');
    }
    if (!keys.every((key) => /^[a-z0-9_-]{1,80}$/.test(key))) {
      throw new BadRequestException('Invalid analytics funnel step');
    }

    return keys.map((key) => ({
      key,
      label: this.funnelLabel(key),
    }));
  }

  private funnelStepKeys(steps: string[]) {
    return this.funnelStepDefinitions(steps.join(',')).map((step) => step.key);
  }

  private async findFunnelDefinition(id: string) {
    const definition = await this.prisma.analyticsFunnelDefinition.findUnique({
      where: { id },
    });
    if (!definition || definition.deletedAt) {
      throw new NotFoundException('Analytics funnel definition not found');
    }
    return definition;
  }

  private optionalTrim(value?: string) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private funnelLabel(key: string) {
    const labels: Record<string, string> = {
      landing_visit: 'Visitas landing',
      project_view: 'Vistas proyecto',
      cv_download: 'Descargas CV',
      contact_submit: 'Formularios contacto',
      linkedin_click: 'Clicks LinkedIn',
    };
    return labels[key] || key.replace(/_/g, ' ');
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

  private retentionWorkerStatus(retentionDays: number | null) {
    return {
      enabled:
        Boolean(retentionDays) &&
        this.configService.get<string>('ANALYTICS_RETENTION_WORKER_ENABLED') !==
          'false',
      intervalMs: this.numberConfig(
        'ANALYTICS_RETENTION_WORKER_INTERVAL_MS',
        86_400_000,
        60_000,
        604_800_000,
      ),
    };
  }

  private numberConfig(
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ) {
    const configured = Number(this.configService.get<string>(key) || fallback);
    if (!Number.isFinite(configured)) {
      return fallback;
    }
    return Math.min(Math.max(Math.trunc(configured), minimum), maximum);
  }

  private attributionMetadata(dto: AnalyticsEventInput) {
    const attribution = this.resolveAttribution(
      { source: dto.source, channel: dto.channel },
      dto.path,
    );
    return {
      ...attribution,
      ...this.cleanContext(dto.context),
    } as never;
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

  private cleanLabel(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? value.trim().slice(0, 160)
      : null;
  }

  private cleanPath(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? value.trim().slice(0, 160)
      : null;
  }

  private cleanContext(context?: Record<string, string | null | undefined>) {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(context || {})) {
      const cleanKey = this.cleanSegment(key);
      const cleanValue = this.cleanLabel(value);
      if (cleanKey && cleanValue) {
        cleaned[cleanKey] = cleanValue;
      }
    }
    return cleaned;
  }

  private contextSegment(metadata: unknown) {
    const record = this.metadataRecord(metadata);
    const base = this.cleanLabel(record.basecvversionid);
    const role = this.cleanLabel(record.targetroleid);
    const company = this.cleanLabel(record.hastargetcompany);
    const parts = [
      base ? `base=${base}` : null,
      role ? `role=${role}` : null,
      company ? `company=${company}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' | ') : null;
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

  private percent(value: number, total: number) {
    if (!total) {
      return 0;
    }
    return Math.round((value / total) * 1000) / 10;
  }
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
