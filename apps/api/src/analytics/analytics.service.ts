import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  record(dto: CreateAnalyticsEventDto, ip?: string, userAgent?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        ...dto,
        ipHash: ip ? createHash('sha256').update(ip).digest('hex') : null,
        userAgent,
      },
    });
  }

  async summary() {
    const [totalVisits, cvDownloads, contactSubmits, projectViews] =
      await Promise.all([
        this.prisma.analyticsEvent.count({ where: { type: 'landing_visit' } }),
        this.prisma.analyticsEvent.count({ where: { type: 'cv_download' } }),
        this.prisma.analyticsEvent.count({ where: { type: 'contact_submit' } }),
        this.prisma.analyticsEvent.count({ where: { type: 'project_view' } }),
      ]);

    return { totalVisits, cvDownloads, contactSubmits, projectViews };
  }

  list() {
    return this.prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
