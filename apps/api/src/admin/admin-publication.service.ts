import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const THEME_FIELDS = [
  'primaryColor',
  'secondaryColor',
  'backgroundColor',
  'textColor',
  'fontFamily',
  'borderRadius',
  'cardStyle',
  'animationIntensity',
  'colorMode',
] as const;

type ThemeField = (typeof THEME_FIELDS)[number];
type ThemeValues = Record<ThemeField, string>;

@Injectable()
export class AdminPublicationService {
  constructor(private readonly prisma: PrismaService) {}

  async themeReview() {
    const [theme, latestChanges] = await Promise.all([
      this.prisma.themeSettings.findFirst(),
      this.latestChanges('theme'),
    ]);

    if (!theme) {
      return {
        entityType: 'theme',
        entityId: null,
        hasDraft: false,
        publishedAt: null,
        fields: [],
        latestChanges,
      };
    }

    const published = this.pickThemeValues(theme);
    const draft = this.readThemeDraft(theme.draftJson);
    const fields = THEME_FIELDS.map((field) => {
      const before = published[field];
      const after = draft?.[field] ?? before;
      return {
        field,
        before,
        after,
        changed: before !== after,
      };
    });

    return {
      entityType: 'theme',
      entityId: theme.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: theme.publishedAt,
      fields,
      latestChanges,
    };
  }

  async publishThemeDraft(actorUserId?: string) {
    const theme = await this.prisma.themeSettings.findFirst();
    if (!theme) {
      throw new NotFoundException('Theme settings not found');
    }

    const draft = this.readThemeDraft(theme.draftJson);
    if (!draft) {
      throw new BadRequestException('Theme draft not found');
    }

    const before = this.pickThemeValues(theme);
    const after: ThemeValues = { ...before, ...draft };
    const changedFields = THEME_FIELDS.filter(
      (field) => before[field] !== after[field],
    );
    if (!changedFields.length) {
      throw new BadRequestException('Theme draft has no changes');
    }

    const published = await this.prisma.themeSettings.update({
      where: { id: theme.id },
      data: {
        ...after,
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'theme',
        entityId: theme.id,
        action: 'publish',
        summary: `Published theme draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'theme',
        resourceId: theme.id,
        metadata: { changedFields } as never,
      },
    });

    return {
      published,
      changedFields,
    };
  }

  async restoreThemeChange(changeLogId: string, actorUserId?: string) {
    const change = await this.prisma.changeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!change || change.entityType !== 'theme' || !change.entityId) {
      throw new NotFoundException('Theme change not found');
    }

    const restoreValues = this.readThemeDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Theme change cannot be restored');
    }

    const theme = await this.prisma.themeSettings.findUnique({
      where: { id: change.entityId },
    });
    if (!theme) {
      throw new NotFoundException('Theme settings not found');
    }

    const before = this.pickThemeValues(theme);
    const after: ThemeValues = { ...before, ...restoreValues };
    const changedFields = THEME_FIELDS.filter(
      (field) => before[field] !== after[field],
    );
    if (!changedFields.length) {
      throw new BadRequestException('Theme is already at this version');
    }

    const restored = await this.prisma.themeSettings.update({
      where: { id: theme.id },
      data: {
        ...after,
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'theme',
        entityId: theme.id,
        action: 'restore',
        summary: `Restored theme change ${changeLogId}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'theme',
        resourceId: theme.id,
        metadata: { changeLogId, changedFields } as never,
      },
    });

    return {
      restored,
      changedFields,
    };
  }

  latestChanges(entityType?: string) {
    return this.prisma.changeLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private pickThemeValues(theme: Record<string, unknown>): ThemeValues {
    return THEME_FIELDS.reduce((values, field) => {
      values[field] = typeof theme[field] === 'string' ? theme[field] : '';
      return values;
    }, {} as ThemeValues);
  }

  private readThemeDraft(draftJson: unknown): Partial<ThemeValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = THEME_FIELDS.reduce((current, field) => {
      if (typeof draft[field] === 'string') {
        current[field] = draft[field];
      }
      return current;
    }, {} as Partial<ThemeValues>);

    return Object.keys(values).length ? values : null;
  }
}
