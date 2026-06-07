import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TranslationQueryDto,
  UpdateTranslationDto,
  UpsertTranslationDto,
} from './translations.dto';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: TranslationQueryDto = {}, forcePublic = false) {
    return this.prisma.translationEntry.findMany({
      where: {
        deletedAt: null,
        ...(query.locale ? { locale: query.locale } : {}),
        ...(query.namespace ? { namespace: query.namespace } : {}),
        ...(forcePublic || query.includeHidden !== 'true'
          ? { visible: true }
          : {}),
      },
      orderBy: [{ locale: 'asc' }, { namespace: 'asc' }, { key: 'asc' }],
    });
  }

  async upsert(dto: UpsertTranslationDto) {
    const data = this.normalizedData(dto);
    return this.prisma.translationEntry.upsert({
      where: {
        locale_namespace_key: {
          locale: data.locale,
          namespace: data.namespace,
          key: data.key,
        },
      },
      update: {
        value: data.value,
        description: data.description,
        visible: data.visible,
      },
      create: data,
    });
  }

  async update(id: string, dto: UpdateTranslationDto) {
    await this.findActive(id);
    return this.prisma.translationEntry.update({
      where: { id },
      data: {
        ...(dto.value !== undefined ? { value: dto.value.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: this.optionalTrim(dto.description) }
          : {}),
        ...(dto.visible !== undefined ? { visible: dto.visible } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findActive(id);
    return this.prisma.translationEntry.update({
      where: { id },
      data: { deletedAt: new Date(), visible: false },
    });
  }

  private async findActive(id: string) {
    const entry = await this.prisma.translationEntry.findUnique({
      where: { id },
    });
    if (!entry || entry.deletedAt) {
      throw new NotFoundException('Translation entry not found');
    }
    return entry;
  }

  private normalizedData(dto: UpsertTranslationDto) {
    return {
      locale: dto.locale.trim(),
      namespace: dto.namespace.trim(),
      key: dto.key.trim(),
      value: dto.value.trim(),
      description: this.optionalTrim(dto.description),
      visible: dto.visible ?? true,
    };
  }

  private optionalTrim(value?: string) {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
