import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './profile.dto';

const DATE_KEYS = new Set([
  'startDate',
  'endDate',
  'publishedAt',
  'deletedAt',
  'createdAt',
  'updatedAt',
]);
const SOFT_DELETE_MODELS = new Set([
  'experience',
  'education',
  'certification',
  'skill',
  'project',
  'mediaAsset',
  'pageSection',
  'cvTemplate',
  'cvTargetRole',
]);
const VISIBLE_MODELS = new Set([
  'experience',
  'education',
  'certification',
  'skill',
  'skillCategory',
  'project',
  'projectCategory',
  'pageSection',
  'cvTemplate',
]);

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(model: string, includeHidden = false) {
    const delegate = this.delegate(model);
    const where: Record<string, unknown> = {};
    if (SOFT_DELETE_MODELS.has(model)) {
      where.deletedAt = null;
    }
    if (!includeHidden && VISIBLE_MODELS.has(model)) {
      where.visible = true;
    }
    return delegate.findMany({
      where,
      orderBy:
        'order' in this.orderableFields(model)
          ? [{ order: 'asc' }, { updatedAt: 'desc' }]
          : [{ updatedAt: 'desc' }],
    });
  }

  async findOne(model: string, id: string) {
    const item = await this.delegate(model).findUnique({ where: { id } });
    if (!item || item.deletedAt) {
      throw new NotFoundException(`${model} not found`);
    }
    return item;
  }

  async create(model: string, data: Record<string, unknown>) {
    return this.delegate(model).create({ data: this.normalizeDates(data) });
  }

  async update(model: string, id: string, data: Record<string, unknown>) {
    await this.findOne(model, id);
    return this.delegate(model).update({
      where: { id },
      data: this.normalizeDates(data),
    });
  }

  async remove(model: string, id: string) {
    await this.findOne(model, id);
    if (!SOFT_DELETE_MODELS.has(model)) {
      return this.delegate(model).delete({ where: { id } });
    }
    return this.delegate(model).update({
      where: { id },
      data: { deletedAt: new Date(), visible: false },
    });
  }

  async getProfile() {
    return this.prisma.profile.findFirst();
  }

  async updateProfile(data: UpdateProfileDto) {
    const existing = await this.prisma.profile.findFirst();
    if (!existing) {
      return this.prisma.profile.create({ data: data as never });
    }
    return this.prisma.profile.update({
      where: { id: existing.id },
      data: data as never,
    });
  }

  async getTheme() {
    return this.prisma.themeSettings.findFirst();
  }

  async updateTheme(data: Record<string, unknown>) {
    const existing = await this.prisma.themeSettings.findFirst();
    if (!existing) {
      return this.prisma.themeSettings.create({ data: data as never });
    }
    return this.prisma.themeSettings.update({
      where: { id: existing.id },
      data: data as never,
    });
  }

  private delegate(model: string) {
    const delegate = (this.prisma as unknown as Record<string, any>)[model];
    if (!delegate) {
      throw new BadRequestException(`Unknown resource ${model}`);
    }
    return delegate;
  }

  private orderableFields(model: string) {
    return VISIBLE_MODELS.has(model) || model === 'appModule'
      ? { order: true }
      : {};
  }

  private normalizeDates(data: Record<string, unknown>) {
    const normalized: Record<string, unknown> = { ...data };
    for (const key of Object.keys(normalized)) {
      if (DATE_KEYS.has(key) && typeof normalized[key] === 'string') {
        normalized[key] = normalized[key]
          ? new Date(String(normalized[key]))
          : null;
      }
    }
    return normalized;
  }
}
