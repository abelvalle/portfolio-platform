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
});
