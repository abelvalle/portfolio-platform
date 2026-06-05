import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [
      totalVisits,
      publishedProjects,
      visibleExperiences,
      receivedMessages,
      primaryCv,
      changes,
      modules,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { type: 'landing_visit' } }),
      this.prisma.project.count({
        where: { visible: true, status: 'published', deletedAt: null },
      }),
      this.prisma.experience.count({
        where: { visible: true, deletedAt: null },
      }),
      this.prisma.contactMessage.count({ where: { deletedAt: null } }),
      this.prisma.cvVersion.findFirst({
        where: { isPrimary: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.changeLog.findMany({
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
      latestChanges: changes,
      modules,
    };
  }
}
