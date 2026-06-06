import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService dashboard filters', () => {
  it('applies date range to temporal dashboard data', async () => {
    const prisma = mockPrisma();
    prisma.analyticsEvent.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    prisma.project.count.mockResolvedValue(3);
    prisma.experience.count.mockResolvedValue(2);
    prisma.contactMessage.count.mockResolvedValue(5);
    prisma.cvVersion.findFirst.mockResolvedValue({
      name: 'CV General',
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    });
    prisma.changeLog.findMany.mockResolvedValue([]);
    prisma.appModule.findMany.mockResolvedValue([
      { id: 'module-1', enabled: true },
      { id: 'module-2', enabled: false },
    ]);
    const service = new AdminService(prisma as never);

    const result = await service.dashboard({
      from: '2026-06-01',
      to: '2026-06-05',
    });

    const createdAt = {
      gte: new Date('2026-06-01T00:00:00.000Z'),
      lte: new Date('2026-06-05T23:59:59.999Z'),
    };
    expect(result.cards.totalVisits).toBe(7);
    expect(result.cards.receivedMessages).toBe(5);
    expect(result.segments).toEqual({
      analytics: {
        landingVisits: 7,
        cvDownloads: 2,
        contactSubmits: 1,
        projectViews: 4,
      },
      content: {
        publishedProjects: 3,
        visibleExperiences: 2,
        activeModules: 1,
        totalModules: 2,
      },
    });
    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: { createdAt, type: 'landing_visit' },
    });
    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: { createdAt, type: 'cv_download' },
    });
    expect(prisma.contactMessage.count).toHaveBeenCalledWith({
      where: { createdAt, deletedAt: null },
    });
    expect(prisma.changeLog.findMany).toHaveBeenCalledWith({
      where: { createdAt },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('rejects inverted date ranges', async () => {
    const service = new AdminService(mockPrisma() as never);

    await expect(
      service.dashboard({ from: '2026-06-05', to: '2026-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function mockPrisma() {
  return {
    analyticsEvent: {
      count: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    experience: {
      count: jest.fn(),
    },
    contactMessage: {
      count: jest.fn(),
    },
    cvVersion: {
      findFirst: jest.fn(),
    },
    changeLog: {
      findMany: jest.fn(),
    },
    appModule: {
      findMany: jest.fn(),
    },
  };
}
