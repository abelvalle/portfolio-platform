import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CvExportService } from './cv-export.service';

@Injectable()
export class CvVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exporter: CvExportService,
  ) {}

  list() {
    return this.prisma.cvVersion.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.cvVersion.findUnique({ where: { id } });
    if (!version || version.deletedAt) {
      throw new NotFoundException('CV version not found');
    }
    return version;
  }

  create(data: Record<string, any>) {
    return this.prisma.cvVersion.create({
      data: {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: data.status || PublishStatus.draft,
        structuredJson: data.structuredJson || {},
      } as any,
    });
  }

  async update(id: string, data: Record<string, any>) {
    await this.findOne(id);
    return this.prisma.cvVersion.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cvVersion.update({
      where: { id },
      data: { deletedAt: new Date(), status: PublishStatus.archived },
    });
  }

  async setPrimary(id: string) {
    const version = await this.findOne(id);
    const [, selected] = await this.prisma.$transaction([
      this.prisma.cvVersion.updateMany({
        where: { cvId: version.cvId, deletedAt: null },
        data: { isPrimary: false },
      }),
      this.prisma.cvVersion.update({
        where: { id: version.id },
        data: { isPrimary: true, status: PublishStatus.published },
      }),
    ]);
    return selected;
  }

  async generatePdf(id: string) {
    const version = await this.findOneWithTemplate(id);
    const file = await this.exporter.generatePdf(
      version.id,
      version.structuredJson as never,
      { template: this.exportTemplate(version) },
    );
    return this.persistGeneratedFile(
      version.id,
      file,
      'pdf',
      'application/pdf',
      this.generationMetadata(version),
    );
  }

  async generateDocx(id: string) {
    const version = await this.findOneWithTemplate(id);
    const file = await this.exporter.generateDocx(
      version.id,
      version.structuredJson as never,
      { template: this.exportTemplate(version) },
    );
    return this.persistGeneratedFile(
      version.id,
      file,
      'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      this.generationMetadata(version),
    );
  }

  private async findOneWithTemplate(id: string) {
    const version = await this.prisma.cvVersion.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!version || version.deletedAt) {
      throw new NotFoundException('CV version not found');
    }
    return version;
  }

  private exportTemplate(version: {
    template?: { name: string; slug: string; config: unknown } | null;
  }) {
    if (!version.template) {
      return undefined;
    }
    return {
      name: version.template.name,
      slug: version.template.slug,
      config: version.template.config,
    };
  }

  private generationMetadata(version: {
    template?: { name: string; slug: string; config: unknown } | null;
  }) {
    return {
      template: this.exportTemplate(version),
    };
  }

  private async persistGeneratedFile(
    versionId: string,
    file: { filename: string; path: string; url: string },
    type: 'pdf' | 'docx',
    mimeType: string,
    metadata?: Record<string, unknown>,
  ) {
    const media = await this.prisma.mediaAsset.create({
      data: {
        filename: file.filename,
        originalName: file.filename,
        mimeType,
        url: file.url,
        storageKey: file.path,
        type: 'cv-generated',
        metadata: metadata as never,
      },
    });
    const generated = await this.prisma.cvGeneratedFile.create({
      data: {
        cvVersionId: versionId,
        mediaAssetId: media.id,
        type,
        url: file.url,
        metadata: metadata as never,
      },
    });
    await this.prisma.cvVersion.update({
      where: { id: versionId },
      data:
        type === 'pdf'
          ? { generatedPdfId: media.id }
          : { generatedDocxId: media.id },
    });
    return { media, generated };
  }
}
