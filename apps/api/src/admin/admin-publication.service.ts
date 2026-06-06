import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeLog, Prisma } from '@prisma/client';
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

const PROFILE_FIELDS = [
  'fullName',
  'headline',
  'subtitle',
  'shortBio',
  'longBio',
  'location',
  'availability',
  'email',
  'phone',
  'linkedin',
  'github',
  'website',
  'avatarUrl',
  'cvUrl',
  'seoTitle',
  'seoDescription',
  'ogImageUrl',
  'primaryLanguage',
  'ctaPrimary',
  'ctaSecondary',
] as const;

type ProfileField = (typeof PROFILE_FIELDS)[number];
type ProfileValues = Record<ProfileField, string | null>;

const REQUIRED_PROFILE_FIELDS = new Set<ProfileField>([
  'fullName',
  'headline',
  'subtitle',
  'shortBio',
  'longBio',
  'location',
  'availability',
  'email',
  'primaryLanguage',
  'ctaPrimary',
  'ctaSecondary',
]);

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

  async profileReview() {
    const [profile, latestChanges] = await Promise.all([
      this.prisma.profile.findFirst(),
      this.latestChanges('profile'),
    ]);

    if (!profile) {
      return {
        entityType: 'profile',
        entityId: null,
        hasDraft: false,
        publishedAt: null,
        fields: [],
        latestChanges,
      };
    }

    const published = this.pickProfileValues(profile);
    const draft = this.readProfileDraft(profile.draftJson);
    const fields = PROFILE_FIELDS.map((field) => {
      const before = published[field];
      const hasDraftValue =
        draft && Object.prototype.hasOwnProperty.call(draft, field);
      const after = hasDraftValue ? (draft[field] ?? null) : before;
      return {
        field,
        before,
        after,
        changed: before !== after,
      };
    });

    return {
      entityType: 'profile',
      entityId: profile.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: profile.publishedAt,
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

  async publishProfileDraft(actorUserId?: string) {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const draft = this.readProfileDraft(profile.draftJson);
    if (!draft) {
      throw new BadRequestException('Profile draft not found');
    }

    const before = this.pickProfileValues(profile);
    const after: ProfileValues = { ...before, ...draft };
    const changedFields = PROFILE_FIELDS.filter(
      (field) => before[field] !== after[field],
    );
    const missingRequiredFields = [...REQUIRED_PROFILE_FIELDS].filter(
      (field) => !after[field]?.trim(),
    );
    if (missingRequiredFields.length) {
      throw new BadRequestException(
        `Profile draft is missing required fields: ${missingRequiredFields.join(', ')}`,
      );
    }
    if (!changedFields.length) {
      throw new BadRequestException('Profile draft has no changes');
    }

    const published = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...this.buildProfileUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'profile',
        entityId: profile.id,
        action: 'publish',
        summary: `Published profile draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'profile',
        resourceId: profile.id,
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

    return this.restoreThemeSnapshot(change, actorUserId);
  }

  async restorePublicationChange(changeLogId: string, actorUserId?: string) {
    const change = await this.prisma.changeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!change || !change.entityId) {
      throw new NotFoundException('Publication change not found');
    }

    if (change.entityType === 'theme') {
      return this.restoreThemeSnapshot(change, actorUserId);
    }

    if (change.entityType === 'profile') {
      return this.restoreProfileSnapshot(change, actorUserId);
    }

    throw new NotFoundException('Publication change not found');
  }

  private async restoreThemeSnapshot(change: ChangeLog, actorUserId?: string) {
    if (!change.entityId) {
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
        summary: `Restored theme change ${change.id}`,
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
        metadata: { changeLogId: change.id, changedFields } as never,
      },
    });

    return {
      restored,
      changedFields,
    };
  }

  private async restoreProfileSnapshot(
    change: ChangeLog,
    actorUserId?: string,
  ) {
    if (!change.entityId) {
      throw new NotFoundException('Profile change not found');
    }

    const restoreValues = this.readProfileDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Profile change cannot be restored');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: change.entityId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const before = this.pickProfileValues(profile);
    const after: ProfileValues = { ...before, ...restoreValues };
    const changedFields = PROFILE_FIELDS.filter(
      (field) => before[field] !== after[field],
    );
    if (!changedFields.length) {
      throw new BadRequestException('Profile is already at this version');
    }

    const restored = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...this.buildProfileUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'profile',
        entityId: profile.id,
        action: 'restore',
        summary: `Restored profile change ${change.id}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'profile',
        resourceId: profile.id,
        metadata: { changeLogId: change.id, changedFields } as never,
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

  private pickProfileValues(profile: Record<string, unknown>): ProfileValues {
    return PROFILE_FIELDS.reduce((values, field) => {
      values[field] =
        typeof profile[field] === 'string' ? String(profile[field]) : null;
      return values;
    }, {} as ProfileValues);
  }

  private buildProfileUpdateData(
    values: ProfileValues,
  ): Prisma.ProfileUpdateInput {
    return PROFILE_FIELDS.reduce(
      (data, field) => {
        const value = values[field];
        data[field] = REQUIRED_PROFILE_FIELDS.has(field)
          ? (value ?? '')
          : value;
        return data;
      },
      {} as Record<ProfileField, string | null>,
    ) as Prisma.ProfileUpdateInput;
  }

  private readProfileDraft(draftJson: unknown): Partial<ProfileValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = PROFILE_FIELDS.reduce((current, field) => {
      if (typeof draft[field] === 'string' || draft[field] === null) {
        current[field] = draft[field];
      }
      return current;
    }, {} as Partial<ProfileValues>);

    return Object.keys(values).length ? values : null;
  }
}
