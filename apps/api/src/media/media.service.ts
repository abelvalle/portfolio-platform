import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMediaAssetDto,
  UpdateMediaAssetDto,
  UploadMediaDto,
} from './media.dto';
import {
  MediaStorageService,
  type UploadedMediaFile,
} from './media-storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
  ) {}

  async storageStatus() {
    const [assetCount, sizeAggregate] = await Promise.all([
      this.prisma.mediaAsset.count({ where: { deletedAt: null } }),
      this.prisma.mediaAsset.aggregate({
        where: { deletedAt: null },
        _sum: { size: true },
      }),
    ]);
    const usedBytes = sizeAggregate._sum.size || 0;

    return {
      ...this.storage.getStatus(),
      assetCount,
      usedBytes,
      usedMb: Number((usedBytes / 1024 / 1024).toFixed(2)),
    };
  }

  list() {
    return this.prisma.mediaAsset.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Media asset not found');
    }
    return asset;
  }

  create(data: CreateMediaAssetDto) {
    return this.prisma.mediaAsset.create({
      data: { ...data, metadata: data.metadata as never },
    });
  }

  async upload(file: UploadedMediaFile, data: UploadMediaDto) {
    const stored = await this.storage.save(file);
    return this.prisma.mediaAsset.create({
      data: {
        filename: stored.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: stored.url,
        storageKey: stored.storageKey,
        altText: data.altText,
        type: data.type || 'upload',
        metadata: {
          storageProvider: this.storage.getStatus().provider,
        } as never,
      },
    });
  }

  async update(id: string, data: UpdateMediaAssetDto) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: { ...data, metadata: data.metadata as never },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async download(id: string) {
    const asset = await this.findOne(id);
    const stream = await this.storage.createReadStream(asset.storageKey);
    return { asset, stream };
  }
}
