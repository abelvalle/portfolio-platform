import { CvVersionService } from './cv-version.service';

describe('CvVersionService', () => {
  it('generates PDF for the selected version and stores media references', async () => {
    const prisma = mockPrisma();
    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: 'cv-version.pdf',
        path: 'generated/cv-version.pdf',
        url: '/generated/cv-version.pdf',
      }),
      generateDocx: jest.fn(),
    };
    const service = new CvVersionService(prisma as never, exporter as never);

    const result = await service.generatePdf('version-1', 'user-1');

    expect(exporter.generatePdf).toHaveBeenCalledWith(
      'version-1',
      { profile: { fullName: 'Abel Valle Rosa' } },
      {
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: { primaryColor: '#0f766e' },
        },
      },
    );
    expect(prisma.cvVersion.update).toHaveBeenCalledWith({
      where: { id: 'version-1' },
      data: { generatedPdfId: 'media-1' },
    });
    expect(result.media.id).toBe('media-1');
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'generate_pdf',
        resource: 'cv-version',
        resourceId: 'version-1',
      }),
    });
  });

  it('marks only the selected version as primary within its CV', async () => {
    const prisma = mockPrisma();
    const service = new CvVersionService(prisma as never, {} as never);

    const result = await service.setPrimary('version-1', 'user-1');

    expect(prisma.cvVersion.updateMany).toHaveBeenCalledWith({
      where: { cvId: 'cv-1', deletedAt: null },
      data: { isPrimary: false },
    });
    expect(prisma.cvVersion.update).toHaveBeenCalledWith({
      where: { id: 'version-1' },
      data: { isPrimary: true, status: 'published' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'version-1', isPrimary: true });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'set_primary',
        resource: 'cv-version',
        resourceId: 'version-1',
      }),
    });
  });

  it('audits version creation and updates', async () => {
    const prisma = mockPrisma();
    const service = new CvVersionService(prisma as never, {} as never);

    await service.create({ cvId: 'cv-1', name: 'CV copia' }, 'user-1');
    await service.update('version-1', { status: 'published' }, 'user-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'create',
        resource: 'cv-version',
        resourceId: 'version-new',
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'update',
        resource: 'cv-version',
        resourceId: 'version-1',
        metadata: { changedFields: ['status'] },
      }),
    });
  });

  it('lists recent audit events for CV versions', async () => {
    const prisma = mockPrisma();
    const service = new CvVersionService(prisma as never, {} as never);

    const result = await service.auditTrail({
      action: 'generate_pdf',
      userId: 'user-1',
      from: '2026-06-01',
      to: '2026-06-06',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        resource: 'cv-version',
        action: 'generate_pdf',
        userId: 'user-1',
        createdAt: {
          gte: new Date('2026-06-01'),
          lte: new Date('2026-06-06T23:59:59.999Z'),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    expect(result).toEqual([{ id: 'audit-1', action: 'generate_pdf' }]);
  });
});

function mockPrisma() {
  return {
    cvVersion: {
      create: jest.fn().mockResolvedValue({
        id: 'version-new',
        cvId: 'cv-1',
        status: 'draft',
      }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'version-1',
        cvId: 'cv-1',
        status: 'draft',
        deletedAt: null,
        structuredJson: { profile: { fullName: 'Abel Valle Rosa' } },
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: { primaryColor: '#0f766e' },
        },
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      update: jest.fn().mockResolvedValue({ id: 'version-1', isPrimary: true }),
    },
    mediaAsset: {
      create: jest.fn().mockResolvedValue({ id: 'media-1' }),
    },
    cvGeneratedFile: {
      create: jest.fn().mockResolvedValue({
        id: 'generated-1',
        mediaAssetId: 'media-1',
        type: 'pdf',
      }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 'audit-1', action: 'generate_pdf' }]),
    },
    $transaction: jest
      .fn()
      .mockImplementation(async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
  };
}
