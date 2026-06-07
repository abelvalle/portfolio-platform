import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AnalyticsDateRangeQueryDto } from '../analytics/analytics.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(filters: AnalyticsDateRangeQueryDto = {}) {
    const dateWhere = this.dateRangeWhere(filters);
    const [
      totalVisits,
      cvDownloads,
      contactSubmits,
      projectViews,
      publishedProjects,
      visibleExperiences,
      receivedMessages,
      primaryCv,
      changes,
      modules,
      landingCohortEvents,
    ] = await Promise.all([
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
      this.prisma.project.count({
        where: { visible: true, status: 'published', deletedAt: null },
      }),
      this.prisma.experience.count({
        where: { visible: true, deletedAt: null },
      }),
      this.prisma.contactMessage.count({
        where: { ...dateWhere, deletedAt: null },
      }),
      this.prisma.cvVersion.findFirst({
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.changeLog.findMany({
        where: dateWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.appModule.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.analyticsEvent.findMany({
        where: { ...dateWhere, type: 'landing_visit' },
        select: { createdAt: true, metadata: true, path: true },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      }),
    ]);

    return {
      cards: {
        totalVisits,
        publishedProjects,
        visibleExperiences,
        receivedMessages,
        primaryCv: primaryCv?.name ?? 'Sin CV principal',
        cvUpdatedAt: primaryCv?.updatedAt ?? null,
      },
      segments: {
        analytics: {
          landingVisits: totalVisits,
          cvDownloads,
          contactSubmits,
          projectViews,
        },
        content: {
          publishedProjects,
          visibleExperiences,
          activeModules: modules.filter((module) => module.enabled).length,
          totalModules: modules.length,
        },
        cohorts: this.monthlyCohorts(landingCohortEvents),
        cohortSources: this.monthlySourceCohorts(landingCohortEvents),
        cohortComparisons: this.monthlyCohortComparisons(landingCohortEvents),
        cohortSourceComparisons:
          this.monthlySourceCohortComparisons(landingCohortEvents),
      },
      latestChanges: changes,
      modules,
    };
  }

  private dateRangeWhere(filters: AnalyticsDateRangeQueryDto): {
    createdAt?: Prisma.DateTimeFilter;
  } {
    const from = filters.from ? startOfDayUtc(filters.from) : null;
    const to = filters.to ? endOfDayUtc(filters.to) : null;

    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('Invalid dashboard date range');
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

  private monthlyCohorts(events: Array<{ createdAt: Date }>) {
    const cohorts = new Map<string, number>();
    for (const event of events) {
      const period = event.createdAt.toISOString().slice(0, 7);
      cohorts.set(period, (cohorts.get(period) || 0) + 1);
    }

    return [...cohorts.entries()]
      .map(([period, count]) => ({ period, count }))
      .sort((left, right) => left.period.localeCompare(right.period))
      .slice(-6);
  }

  private monthlyCohortComparisons(events: Array<{ createdAt: Date }>) {
    const cohorts = new Map<string, number>();
    for (const event of events) {
      const period = event.createdAt.toISOString().slice(0, 7);
      cohorts.set(period, (cohorts.get(period) || 0) + 1);
    }

    return [...cohorts.entries()]
      .map(([period, count]) => {
        const previousPeriod = previousMonth(period);
        const previousCount = cohorts.get(previousPeriod) || 0;
        return {
          period,
          count,
          previousPeriod,
          previousCount,
          delta: count - previousCount,
          deltaPercent: percentDelta(count, previousCount),
        };
      })
      .sort((left, right) => left.period.localeCompare(right.period))
      .slice(-6);
  }

  private monthlySourceCohorts(
    events: Array<{ createdAt: Date; metadata: unknown; path?: string | null }>,
  ) {
    const cohorts = new Map<string, number>();
    for (const event of events) {
      const period = event.createdAt.toISOString().slice(0, 7);
      const attribution = this.resolveAttribution(event.metadata, event.path);
      const key = `${period}|${attribution.source}|${attribution.channel}`;
      cohorts.set(key, (cohorts.get(key) || 0) + 1);
    }

    return [...cohorts.entries()]
      .map(([key, count]) => {
        const [period, source, channel] = key.split('|');
        return { period, source, channel, count };
      })
      .sort(
        (left, right) =>
          left.period.localeCompare(right.period) ||
          right.count - left.count ||
          left.source.localeCompare(right.source),
      )
      .slice(-8);
  }

  private monthlySourceCohortComparisons(
    events: Array<{ createdAt: Date; metadata: unknown; path?: string | null }>,
  ) {
    const cohorts = new Map<string, number>();
    for (const event of events) {
      const period = event.createdAt.toISOString().slice(0, 7);
      const attribution = this.resolveAttribution(event.metadata, event.path);
      const key = `${period}|${attribution.source}|${attribution.channel}`;
      cohorts.set(key, (cohorts.get(key) || 0) + 1);
    }

    return [...cohorts.entries()]
      .map(([key, count]) => {
        const [period, source, channel] = key.split('|');
        const previousPeriod = previousMonth(period);
        const previousCount =
          cohorts.get(`${previousPeriod}|${source}|${channel}`) || 0;
        return {
          period,
          source,
          channel,
          count,
          previousPeriod,
          previousCount,
          delta: count - previousCount,
          deltaPercent: percentDelta(count, previousCount),
        };
      })
      .sort(
        (left, right) =>
          left.period.localeCompare(right.period) ||
          right.count - left.count ||
          left.source.localeCompare(right.source),
      )
      .slice(-8);
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

  private metadataRecord(metadata: unknown): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return {};
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
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function previousMonth(period: string) {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return date.toISOString().slice(0, 7);
}

function percentDelta(current: number, previous: number) {
  if (!previous) {
    return current ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
