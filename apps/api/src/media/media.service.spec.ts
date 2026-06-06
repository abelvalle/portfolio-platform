import { MediaService } from './media.service';
import { BadRequestException } from '@nestjs/common';

describe('MediaService', () => {
  it('adds active asset usage metrics to storage status', async () => {
    const prisma = {
      mediaAsset: {
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest.fn().mockResolvedValue({ _sum: { size: 3145728 } }),
      },
    };
    const storage = {
      getStatus: jest.fn().mockReturnValue({
        provider: 'local',
        storageDir: 'storage',
        maxFileSizeMb: 10,
        allowedMimeTypes: ['application/pdf'],
        uploadEndpoint: '/api/v1/media/upload',
        downloadPattern: '/api/v1/media/:id/download',
      }),
    };
    const service = new MediaService(prisma as never, storage as never);

    await expect(service.storageStatus()).resolves.toMatchObject({
      provider: 'local',
      assetCount: 2,
      usedBytes: 3145728,
      usedMb: 3,
    });
    expect(prisma.mediaAsset.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });

  it('rejects uploads that exceed configured storage quota', async () => {
    const prisma = {
      mediaAsset: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { size: 1048570 } }),
        create: jest.fn(),
      },
    };
    const storage = {
      getStatus: jest.fn().mockReturnValue({
        provider: 'local',
        quotaMb: 1,
      }),
      save: jest.fn(),
    };
    const service = new MediaService(prisma as never, storage as never);

    await expect(
      service.upload(
        {
          originalname: 'cv.pdf',
          mimetype: 'application/pdf',
          size: 10,
          buffer: Buffer.from('x'),
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('audits successful uploads', async () => {
    const prisma = {
      mediaAsset: {
        create: jest.fn().mockResolvedValue({
          id: 'media-1',
          filename: 'cv-demo.pdf',
          originalName: 'CV Demo.pdf',
          mimeType: 'application/pdf',
          size: 2000,
          type: 'cv-manual',
        }),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    const storage = {
      getStatus: jest
        .fn()
        .mockReturnValue({ provider: 'local', quotaMb: null }),
      save: jest.fn().mockResolvedValue({
        filename: 'cv-demo.pdf',
        storageKey: 'storage/uploads/cv-demo.pdf',
        url: '/media/uploads/cv-demo.pdf',
      }),
    };
    const service = new MediaService(prisma as never, storage as never);

    await service.upload(
      {
        originalname: 'CV Demo.pdf',
        mimetype: 'application/pdf',
        size: 2000,
        buffer: Buffer.from('pdf'),
      },
      { type: 'cv-manual' },
      'user-1',
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'upload',
        resource: 'media',
        resourceId: 'media-1',
      }),
    });
  });

  it('audits soft deletes', async () => {
    const prisma = {
      mediaAsset: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'media-1',
          filename: 'cv-demo.pdf',
          deletedAt: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'media-1',
          filename: 'cv-demo.pdf',
          originalName: 'CV Demo.pdf',
          mimeType: 'application/pdf',
          size: 2000,
          type: 'cv-manual',
        }),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    const service = new MediaService(prisma as never, {} as never);

    await service.remove('media-1', 'user-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'delete',
        resource: 'media',
        resourceId: 'media-1',
      }),
    });
  });

  it('purges deleted media files after the retention window', async () => {
    const deletedAt = new Date('2026-06-01T08:00:00.000Z');
    const prisma = {
      mediaAsset: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'media-1',
            storageKey: 'storage/uploads/cv-demo.pdf',
            metadata: { source: 'test' },
            deletedAt,
          },
          {
            id: 'media-2',
            storageKey: 'storage/uploads/missing.pdf',
            metadata: null,
            deletedAt,
          },
        ]),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    const storage = {
      deleteLocalFile: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    };
    const service = new MediaService(prisma as never, storage as never);

    const result = await service.purgeDeleted({ retentionDays: 7 }, 'user-1');

    expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: { lte: expect.any(Date) },
        storageKey: { not: null },
      },
      orderBy: { deletedAt: 'asc' },
    });
    expect(storage.deleteLocalFile).toHaveBeenCalledTimes(2);
    expect(prisma.mediaAsset.update).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      retentionDays: 7,
      dryRun: false,
      scanned: 2,
      deletedFiles: 1,
      missingFiles: 1,
      assetIds: ['media-1', 'media-2'],
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'purge-deleted',
        resource: 'media',
        resourceId: 'storage',
      }),
    });
  });

  it('reports purge candidates without deleting files in dry run mode', async () => {
    const prisma = {
      mediaAsset: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'media-1',
            storageKey: 'storage/uploads/cv-demo.pdf',
            metadata: null,
          },
        ]),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    const storage = {
      deleteLocalFile: jest.fn(),
    };
    const service = new MediaService(prisma as never, storage as never);

    const result = await service.purgeDeleted(
      { retentionDays: 0, dryRun: true },
      'user-1',
    );

    expect(storage.deleteLocalFile).not.toHaveBeenCalled();
    expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      retentionDays: 0,
      dryRun: true,
      scanned: 1,
      deletedFiles: 0,
      missingFiles: 0,
      assetIds: ['media-1'],
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'purge-deleted-dry-run',
        resource: 'media',
        resourceId: 'storage',
      }),
    });
  });
});
