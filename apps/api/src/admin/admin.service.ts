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
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
