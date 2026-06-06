import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CvAtsService } from './cv-ats.service';
import { CreateCvDto } from './cv.dto';
import { CvExportService } from './cv-export.service';
import { CvParserService } from './cv-parser.service';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: CvParserService,
    private readonly exporter: CvExportService,
    private readonly atsService: CvAtsService,
  ) {}

  list() {
    return this.prisma.cv.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(idOrSlug: string) {
    const cv = await this.prisma.cv.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
      include: { sections: { orderBy: { order: 'asc' } }, versions: true },
    });
    if (!cv) {
      throw new NotFoundException('CV not found');
    }
    return cv;
  }

  async getPrimary() {
    const cv = await this.prisma.cv.findFirst({
      where: { isPrimary: true, deletedAt: null },
      include: {
        sections: { orderBy: { order: 'asc' } },
        versions: { where: { isPrimary: true } },
      },
    });
    if (!cv) {
      throw new NotFoundException('Primary CV not found');
    }
    return cv;
  }

  create(dto: CreateCvDto) {
    return this.prisma.cv.create({
      data: {
        slug: this.slugify(dto.name),
        name: dto.name,
        headline: dto.headline,
        summary: dto.summary,
        contactJson: {},
        structuredJson: (dto.structuredJson || {}) as any,
        status: PublishStatus.draft,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findOne(id);
    return this.prisma.cv.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cv.update({
      where: { id },
      data: { deletedAt: new Date(), status: PublishStatus.archived },
    });
  }

  importFromText(rawText: string) {
    const parsed = this.parser.parsePlainText(rawText);
    return this.prisma.cv.create({
      data: {
        slug: `imported-${Date.now()}`,
        name: parsed.detectedName,
        headline: parsed.detectedHeadline,
        summary: 'CV importado pendiente de revisión estructurada.',
        contactJson: {},
        structuredJson: parsed,
        status: PublishStatus.draft,
      },
    });
  }

  async setPrimary(id: string) {
    const cv = await this.findOne(id);
    await this.prisma.cv.updateMany({ data: { isPrimary: false } });
    return this.prisma.cv.update({
      where: { id: cv.id },
      data: { isPrimary: true, status: PublishStatus.published },
    });
  }

  async generatePdf(cvId: string) {
    const version = await this.findPrimaryVersion(cvId);
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

  async generateDocx(cvId: string) {
    const version = await this.findPrimaryVersion(cvId);
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

  async getAtsReport(cvId: string) {
    const version = await this.findPrimaryVersion(cvId);
    return this.atsService.validate(version.structuredJson as never);
  }

  async getAtsRoleReport(
    cvId: string,
    jobDescription: string,
    targetRole?: string,
  ) {
    const version = await this.findPrimaryVersion(cvId);
    return this.atsService.validateAgainstJobDescription(
      version.structuredJson as never,
      jobDescription,
      targetRole,
    );
  }

  async generateAtsPdf(cvId: string) {
    const version = await this.findPrimaryVersion(cvId);
    const report = this.atsService.validate(version.structuredJson as never);
    const file = await this.exporter.generatePdf(
      version.id,
      version.structuredJson as never,
      { ats: true, template: this.exportTemplate(version) },
    );
    return this.persistGeneratedFile(
      version.id,
      file,
      'pdf',
      'application/pdf',
      this.generationMetadata(version, {
        ats: true,
        atsScore: report.score,
        atsStatus: report.status,
      }),
    );
  }

  async generateAtsDocx(cvId: string) {
    const version = await this.findPrimaryVersion(cvId);
    const report = this.atsService.validate(version.structuredJson as never);
    const file = await this.exporter.generateDocx(
      version.id,
      version.structuredJson as never,
      { ats: true, template: this.exportTemplate(version) },
    );
    return this.persistGeneratedFile(
      version.id,
      file,
      'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      this.generationMetadata(version, {
        ats: true,
        atsScore: report.score,
        atsStatus: report.status,
      }),
    );
  }

  private async findPrimaryVersion(cvId: string) {
    const version = await this.prisma.cvVersion.findFirst({
      where: {
        cvId,
        deletedAt: null,
        OR: [{ isPrimary: true }, { status: PublishStatus.published }],
      },
      include: { template: true },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
    if (!version) {
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

  private generationMetadata(
    version: {
      template?: { name: string; slug: string; config: unknown } | null;
    },
    metadata: Record<string, unknown> = {},
  ) {
    return {
      ...metadata,
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

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
