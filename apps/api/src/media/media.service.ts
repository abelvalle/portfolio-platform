import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMediaAssetDto,
  PurgeDeletedMediaDto,
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

  async upload(
    file: UploadedMediaFile,
    data: UploadMediaDto,
    actorUserId?: string,
  ) {
    await this.assertWithinQuota(file.size);
    const stored = await this.storage.save(file);
    const asset = await this.prisma.mediaAsset.create({
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
    await this.audit('upload', asset.id, actorUserId, {
      filename: asset.filename,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      type: asset.type,
    });
    return asset;
  }

  async update(id: string, data: UpdateMediaAssetDto) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: { ...data, metadata: data.metadata as never },
    });
  }

  async remove(id: string, actorUserId?: string) {
    await this.findOne(id);
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit('delete', asset.id, actorUserId, {
      filename: asset.filename,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      type: asset.type,
    });
    return asset;
  }

  async purgeDeleted(data: PurgeDeletedMediaDto = {}, actorUserId?: string) {
    const retentionDays = data.retentionDays ?? 30;
    const dryRun = data.dryRun ?? false;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        deletedAt: { lte: cutoff },
        storageKey: { not: null },
      },
      orderBy: { deletedAt: 'asc' },
    });
    const result = {
      retentionDays,
      cutoff,
      dryRun,
      scanned: assets.length,
      deletedFiles: 0,
      missingFiles: 0,
      assetIds: assets.map((asset) => asset.id),
    };

    if (dryRun) {
      await this.audit('purge-deleted-dry-run', 'storage', actorUserId, result);
      return result;
    }

    for (const asset of assets) {
      const deleted = await this.storage.deleteLocalFile(asset.storageKey);
      if (deleted) {
        result.deletedFiles += 1;
      } else {
        result.missingFiles += 1;
      }

      await this.prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          storageKey: null,
          metadata: {
            ...this.metadataRecord(asset.metadata),
            physicalDeletedAt: new Date().toISOString(),
            physicalDeleteMissing: !deleted,
          } as never,
        },
      });
    }

    await this.audit('purge-deleted', 'storage', actorUserId, result);
    return result;
  }

  async download(id: string) {
    const asset = await this.findOne(id);
    const stream = await this.storage.createReadStream(asset.storageKey);
    return { asset, stream };
  }

  private async assertWithinQuota(incomingBytes: number) {
    const status = this.storage.getStatus();
    if (!status.quotaMb) {
      return;
    }

    const aggregate = await this.prisma.mediaAsset.aggregate({
      where: { deletedAt: null },
      _sum: { size: true },
    });
    const usedBytes = aggregate._sum.size || 0;
    const quotaBytes = status.quotaMb * 1024 * 1024;

    if (usedBytes + incomingBytes > quotaBytes) {
      throw new BadRequestException('Media storage quota exceeded');
    }
  }

  private audit(
    action: string,
    resourceId: string,
    userId?: string,
    metadata: Record<string, unknown> = {},
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource: 'media',
        resourceId,
        metadata: metadata as never,
      },
    });
  }

  private metadataRecord(metadata: unknown): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }
    return {};
  }
}
