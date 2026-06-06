import { CvVersionService } from './cv-version.service';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MediaService } from '../media/media.service';
import { MediaStorageService } from '../media/media-storage.service';

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
      resourceId: 'version-1',
      userId: 'user-1',
      from: '2026-06-01',
      to: '2026-06-06',
      page: '2',
      limit: '6',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        resource: 'cv-version',
        action: 'generate_pdf',
        resourceId: 'version-1',
        userId: 'user-1',
        createdAt: {
          gte: new Date('2026-06-01'),
          lte: new Date('2026-06-06T23:59:59.999Z'),
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 6,
      take: 6,
    });
    expect(result).toEqual([{ id: 'audit-1', action: 'generate_pdf' }]);
  });

  it('exports filtered audit events as CSV without pagination', async () => {
    const prisma = mockPrisma();
    prisma.auditLog.findMany.mockResolvedValueOnce([
      {
        action: 'set_primary',
        resource: 'cv-version',
        resourceId: 'version-1',
        userId: 'user-1',
        createdAt: new Date('2026-06-06T08:00:00.000Z'),
        metadata: { status: 'published' },
      },
    ]);
    const service = new CvVersionService(prisma as never, {} as never);

    const csv = await service.exportAuditTrailCsv({
      action: 'set_primary',
      resourceId: 'version-1',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        resource: 'cv-version',
        action: 'set_primary',
        resourceId: 'version-1',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(csv).toContain(
      '"action","resource","resourceId","userId","createdAt","metadata"',
    );
    expect(csv).toContain('"set_primary","cv-version","version-1","user-1"');
    expect(csv).toContain('"{""status"":""published""}"');
  });

  it('generates a persisted PDF media asset that can be downloaded from local storage', async () => {
    const storageDir = join(
      'storage-test',
      `cv-generated-download-${Date.now()}`,
    );
    const storageRoot = join(process.cwd(), storageDir);
    const cvDir = join(storageRoot, 'cv');
    const pdfPath = join(cvDir, 'version-1.pdf');
    mkdirSync(cvDir, { recursive: true });
    writeFileSync(pdfPath, Buffer.from('%PDF-1.4 generated cv'));

    const prisma = mockPrisma();
    let persistedMedia: Record<string, unknown> | null = null;
    prisma.mediaAsset.create.mockImplementationOnce(({ data }) => {
      persistedMedia = {
        id: 'media-generated-pdf',
        deletedAt: null,
        ...data,
      };
      return Promise.resolve(persistedMedia);
    });
    prisma.mediaAsset.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(
        where.id === 'media-generated-pdf' ? persistedMedia : null,
      ),
    );
    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: 'version-1.pdf',
        path: pdfPath,
        url: '/media/generated/version-1.pdf',
      }),
      generateDocx: jest.fn(),
    };
    const versionService = new CvVersionService(
      prisma as never,
      exporter as never,
    );
    const mediaService = new MediaService(
      prisma as never,
      new MediaStorageService({
        get: jest.fn((key: string) =>
          key === 'STORAGE_DIR' ? storageDir : undefined,
        ),
      } as never),
    );

    try {
      const generated = await versionService.generatePdf('version-1', 'user-1');
      const download = await mediaService.download(generated.media.id);
      const buffer = await streamToBuffer(download.stream);

      expect(generated.media).toEqual(
        expect.objectContaining({
          id: 'media-generated-pdf',
          filename: 'version-1.pdf',
          mimeType: 'application/pdf',
          storageKey: pdfPath,
        }),
      );
      expect(download.asset.id).toBe('media-generated-pdf');
      expect(buffer.toString()).toBe('%PDF-1.4 generated cv');
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});

function streamToBuffer(stream: NodeJS.ReadableStream) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

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
      findUnique: jest.fn().mockResolvedValue(null),
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
