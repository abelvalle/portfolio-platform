import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeLog, Prisma, PublishStatus } from '@prisma/client';
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

const EXPERIENCE_FIELDS = [
  'company',
  'role',
  'startDate',
  'endDate',
  'current',
  'location',
  'modality',
  'description',
  'achievements',
  'responsibilities',
  'technologies',
  'methodologies',
  'skills',
  'order',
  'visible',
  'featured',
] as const;

type ExperienceField = (typeof EXPERIENCE_FIELDS)[number];
type ExperienceValue = string | number | boolean | string[] | null;
type ExperienceValues = Record<ExperienceField, ExperienceValue>;

const REQUIRED_EXPERIENCE_FIELDS = new Set<ExperienceField>([
  'company',
  'role',
  'startDate',
  'description',
]);

const PROJECT_FIELDS = [
  'name',
  'slug',
  'description',
  'status',
  'categoryId',
  'categoryName',
  'technologies',
  'imageUrl',
  'publicUrl',
  'repositoryUrl',
  'featured',
  'visible',
  'sample',
  'order',
] as const;

type ProjectField = (typeof PROJECT_FIELDS)[number];
type ProjectValue = string | number | boolean | string[] | null;
type ProjectValues = Record<ProjectField, ProjectValue>;

const REQUIRED_PROJECT_FIELDS = new Set<ProjectField>([
  'name',
  'slug',
  'description',
]);

const PROJECT_STATUSES = new Set<string>(Object.values(PublishStatus));

const SKILL_FIELDS = [
  'name',
  'categoryId',
  'categoryName',
  'level',
  'order',
  'visible',
] as const;

type SkillField = (typeof SKILL_FIELDS)[number];
type SkillValue = string | number | boolean | null;
type SkillValues = Record<SkillField, SkillValue>;

const REQUIRED_SKILL_FIELDS = new Set<SkillField>(['name']);

const EDUCATION_FIELDS = [
  'title',
  'institution',
  'date',
  'description',
  'type',
  'certificateUrl',
  'attachmentId',
  'order',
  'visible',
] as const;

type EducationField = (typeof EDUCATION_FIELDS)[number];
type EducationValue = string | number | boolean | null;
type EducationValues = Record<EducationField, EducationValue>;

const REQUIRED_EDUCATION_FIELDS = new Set<EducationField>([
  'title',
  'institution',
  'date',
  'type',
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

  async experienceReview(id: string) {
    const [experience, latestChanges] = await Promise.all([
      this.prisma.experience.findUnique({ where: { id } }),
      this.latestChanges('experience'),
    ]);

    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    const published = this.pickExperienceValues(experience);
    const draft = this.readExperienceDraft(experience.draftJson);
    const fields = EXPERIENCE_FIELDS.map((field) => {
      const before = published[field];
      const hasDraftValue =
        draft && Object.prototype.hasOwnProperty.call(draft, field);
      const after = hasDraftValue ? (draft[field] ?? null) : before;
      return {
        field,
        before,
        after,
        changed: !this.samePublicationValue(before, after),
      };
    });

    return {
      entityType: 'experience',
      entityId: experience.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: experience.publishedAt,
      fields,
      latestChanges,
    };
  }

  async projectReview(id: string) {
    const [project, latestChanges] = await Promise.all([
      this.prisma.project.findUnique({ where: { id } }),
      this.latestChanges('project'),
    ]);

    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    const published = this.pickProjectValues(project);
    const draft = this.readProjectDraft(project.draftJson);
    const fields = PROJECT_FIELDS.map((field) => {
      const before = published[field];
      const hasDraftValue =
        draft && Object.prototype.hasOwnProperty.call(draft, field);
      const after = hasDraftValue ? (draft[field] ?? null) : before;
      return {
        field,
        before,
        after,
        changed: !this.samePublicationValue(before, after),
      };
    });

    return {
      entityType: 'project',
      entityId: project.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: project.publishedAt,
      fields,
      latestChanges,
    };
  }

  async skillReview(id: string) {
    const [skill, latestChanges] = await Promise.all([
      this.prisma.skill.findUnique({ where: { id } }),
      this.latestChanges('skill'),
    ]);

    if (!skill || skill.deletedAt) {
      throw new NotFoundException('Skill not found');
    }

    const published = this.pickSkillValues(skill);
    const draft = this.readSkillDraft(skill.draftJson);
    const fields = SKILL_FIELDS.map((field) => {
      const before = published[field];
      const hasDraftValue =
        draft && Object.prototype.hasOwnProperty.call(draft, field);
      const after = hasDraftValue ? (draft[field] ?? null) : before;
      return {
        field,
        before,
        after,
        changed: !this.samePublicationValue(before, after),
      };
    });

    return {
      entityType: 'skill',
      entityId: skill.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: skill.publishedAt,
      fields,
      latestChanges,
    };
  }

  async educationReview(id: string) {
    const [education, latestChanges] = await Promise.all([
      this.prisma.education.findUnique({ where: { id } }),
      this.latestChanges('education'),
    ]);

    if (!education || education.deletedAt) {
      throw new NotFoundException('Education not found');
    }

    const published = this.pickEducationValues(education);
    const draft = this.readEducationDraft(education.draftJson);
    const fields = EDUCATION_FIELDS.map((field) => {
      const before = published[field];
      const hasDraftValue =
        draft && Object.prototype.hasOwnProperty.call(draft, field);
      const after = hasDraftValue ? (draft[field] ?? null) : before;
      return {
        field,
        before,
        after,
        changed: !this.samePublicationValue(before, after),
      };
    });

    return {
      entityType: 'education',
      entityId: education.id,
      hasDraft: fields.some((field) => field.changed),
      publishedAt: education.publishedAt,
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

  async publishExperienceDraft(id: string, actorUserId?: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
    });
    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    const draft = this.readExperienceDraft(experience.draftJson);
    if (!draft) {
      throw new BadRequestException('Experience draft not found');
    }

    const before = this.pickExperienceValues(experience);
    const after: ExperienceValues = { ...before, ...draft };
    const changedFields = EXPERIENCE_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    const missingRequiredFields = [...REQUIRED_EXPERIENCE_FIELDS].filter(
      (field) => !String(after[field] ?? '').trim(),
    );
    if (missingRequiredFields.length) {
      throw new BadRequestException(
        `Experience draft is missing required fields: ${missingRequiredFields.join(', ')}`,
      );
    }
    if (!changedFields.length) {
      throw new BadRequestException('Experience draft has no changes');
    }

    const published = await this.prisma.experience.update({
      where: { id: experience.id },
      data: {
        ...this.buildExperienceUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'experience',
        entityId: experience.id,
        action: 'publish',
        summary: `Published experience draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'experience',
        resourceId: experience.id,
        metadata: { changedFields } as never,
      },
    });

    return {
      published,
      changedFields,
    };
  }

  async publishProjectDraft(id: string, actorUserId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    const draft = this.readProjectDraft(project.draftJson);
    if (!draft) {
      throw new BadRequestException('Project draft not found');
    }

    const before = this.pickProjectValues(project);
    const after: ProjectValues = { ...before, ...draft };
    const changedFields = PROJECT_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    const missingRequiredFields = [...REQUIRED_PROJECT_FIELDS].filter(
      (field) => !String(after[field] ?? '').trim(),
    );
    if (missingRequiredFields.length) {
      throw new BadRequestException(
        `Project draft is missing required fields: ${missingRequiredFields.join(', ')}`,
      );
    }
    if (!changedFields.length) {
      throw new BadRequestException('Project draft has no changes');
    }

    const published = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...this.buildProjectUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'publish',
        summary: `Published project draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'project',
        resourceId: project.id,
        metadata: { changedFields } as never,
      },
    });

    return {
      published,
      changedFields,
    };
  }

  async publishSkillDraft(id: string, actorUserId?: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });
    if (!skill || skill.deletedAt) {
      throw new NotFoundException('Skill not found');
    }

    const draft = this.readSkillDraft(skill.draftJson);
    if (!draft) {
      throw new BadRequestException('Skill draft not found');
    }

    const before = this.pickSkillValues(skill);
    const after: SkillValues = { ...before, ...draft };
    const changedFields = SKILL_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    const missingRequiredFields = [...REQUIRED_SKILL_FIELDS].filter(
      (field) => !String(after[field] ?? '').trim(),
    );
    if (missingRequiredFields.length) {
      throw new BadRequestException(
        `Skill draft is missing required fields: ${missingRequiredFields.join(', ')}`,
      );
    }
    if (!changedFields.length) {
      throw new BadRequestException('Skill draft has no changes');
    }

    const published = await this.prisma.skill.update({
      where: { id: skill.id },
      data: {
        ...this.buildSkillUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'skill',
        entityId: skill.id,
        action: 'publish',
        summary: `Published skill draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'skill',
        resourceId: skill.id,
        metadata: { changedFields } as never,
      },
    });

    return {
      published,
      changedFields,
    };
  }

  async publishEducationDraft(id: string, actorUserId?: string) {
    const education = await this.prisma.education.findUnique({
      where: { id },
    });
    if (!education || education.deletedAt) {
      throw new NotFoundException('Education not found');
    }

    const draft = this.readEducationDraft(education.draftJson);
    if (!draft) {
      throw new BadRequestException('Education draft not found');
    }

    const before = this.pickEducationValues(education);
    const after: EducationValues = { ...before, ...draft };
    const changedFields = EDUCATION_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    const missingRequiredFields = [...REQUIRED_EDUCATION_FIELDS].filter(
      (field) => !String(after[field] ?? '').trim(),
    );
    if (missingRequiredFields.length) {
      throw new BadRequestException(
        `Education draft is missing required fields: ${missingRequiredFields.join(', ')}`,
      );
    }
    if (!changedFields.length) {
      throw new BadRequestException('Education draft has no changes');
    }

    const published = await this.prisma.education.update({
      where: { id: education.id },
      data: {
        ...this.buildEducationUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'education',
        entityId: education.id,
        action: 'publish',
        summary: `Published education draft (${changedFields.join(', ')})`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'publish',
        resource: 'education',
        resourceId: education.id,
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

    if (change.entityType === 'experience') {
      return this.restoreExperienceSnapshot(change, actorUserId);
    }

    if (change.entityType === 'project') {
      return this.restoreProjectSnapshot(change, actorUserId);
    }

    if (change.entityType === 'skill') {
      return this.restoreSkillSnapshot(change, actorUserId);
    }

    if (change.entityType === 'education') {
      return this.restoreEducationSnapshot(change, actorUserId);
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

  private async restoreExperienceSnapshot(
    change: ChangeLog,
    actorUserId?: string,
  ) {
    if (!change.entityId) {
      throw new NotFoundException('Experience change not found');
    }

    const restoreValues = this.readExperienceDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Experience change cannot be restored');
    }

    const experience = await this.prisma.experience.findUnique({
      where: { id: change.entityId },
    });
    if (!experience || experience.deletedAt) {
      throw new NotFoundException('Experience not found');
    }

    const before = this.pickExperienceValues(experience);
    const after: ExperienceValues = { ...before, ...restoreValues };
    const changedFields = EXPERIENCE_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    if (!changedFields.length) {
      throw new BadRequestException('Experience is already at this version');
    }

    const restored = await this.prisma.experience.update({
      where: { id: experience.id },
      data: {
        ...this.buildExperienceUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'experience',
        entityId: experience.id,
        action: 'restore',
        summary: `Restored experience change ${change.id}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'experience',
        resourceId: experience.id,
        metadata: { changeLogId: change.id, changedFields } as never,
      },
    });

    return {
      restored,
      changedFields,
    };
  }

  private async restoreProjectSnapshot(
    change: ChangeLog,
    actorUserId?: string,
  ) {
    if (!change.entityId) {
      throw new NotFoundException('Project change not found');
    }

    const restoreValues = this.readProjectDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Project change cannot be restored');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: change.entityId },
    });
    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    const before = this.pickProjectValues(project);
    const after: ProjectValues = { ...before, ...restoreValues };
    const changedFields = PROJECT_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    if (!changedFields.length) {
      throw new BadRequestException('Project is already at this version');
    }

    const restored = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...this.buildProjectUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'restore',
        summary: `Restored project change ${change.id}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'project',
        resourceId: project.id,
        metadata: { changeLogId: change.id, changedFields } as never,
      },
    });

    return {
      restored,
      changedFields,
    };
  }

  private async restoreSkillSnapshot(change: ChangeLog, actorUserId?: string) {
    if (!change.entityId) {
      throw new NotFoundException('Skill change not found');
    }

    const restoreValues = this.readSkillDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Skill change cannot be restored');
    }

    const skill = await this.prisma.skill.findUnique({
      where: { id: change.entityId },
    });
    if (!skill || skill.deletedAt) {
      throw new NotFoundException('Skill not found');
    }

    const before = this.pickSkillValues(skill);
    const after: SkillValues = { ...before, ...restoreValues };
    const changedFields = SKILL_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    if (!changedFields.length) {
      throw new BadRequestException('Skill is already at this version');
    }

    const restored = await this.prisma.skill.update({
      where: { id: skill.id },
      data: {
        ...this.buildSkillUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'skill',
        entityId: skill.id,
        action: 'restore',
        summary: `Restored skill change ${change.id}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'skill',
        resourceId: skill.id,
        metadata: { changeLogId: change.id, changedFields } as never,
      },
    });

    return {
      restored,
      changedFields,
    };
  }

  private async restoreEducationSnapshot(
    change: ChangeLog,
    actorUserId?: string,
  ) {
    if (!change.entityId) {
      throw new NotFoundException('Education change not found');
    }

    const restoreValues = this.readEducationDraft(change.beforeJson);
    if (!restoreValues) {
      throw new BadRequestException('Education change cannot be restored');
    }

    const education = await this.prisma.education.findUnique({
      where: { id: change.entityId },
    });
    if (!education || education.deletedAt) {
      throw new NotFoundException('Education not found');
    }

    const before = this.pickEducationValues(education);
    const after: EducationValues = { ...before, ...restoreValues };
    const changedFields = EDUCATION_FIELDS.filter(
      (field) => !this.samePublicationValue(before[field], after[field]),
    );
    if (!changedFields.length) {
      throw new BadRequestException('Education is already at this version');
    }

    const restored = await this.prisma.education.update({
      where: { id: education.id },
      data: {
        ...this.buildEducationUpdateData(after),
        draftJson: Prisma.DbNull,
        publishedAt: new Date(),
      },
    });

    await this.prisma.changeLog.create({
      data: {
        entityType: 'education',
        entityId: education.id,
        action: 'restore',
        summary: `Restored education change ${change.id}`,
        beforeJson: before as never,
        afterJson: after as never,
        actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'restore',
        resource: 'education',
        resourceId: education.id,
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

  private pickExperienceValues(
    experience: Record<string, unknown>,
  ): ExperienceValues {
    return {
      company: this.stringValue(experience.company),
      role: this.stringValue(experience.role),
      startDate: this.dateValue(experience.startDate),
      endDate: this.dateValue(experience.endDate),
      current: Boolean(experience.current),
      location:
        typeof experience.location === 'string' ? experience.location : null,
      modality:
        typeof experience.modality === 'string' ? experience.modality : null,
      description: this.stringValue(experience.description),
      achievements: this.stringArrayValue(experience.achievements),
      responsibilities: this.stringArrayValue(experience.responsibilities),
      technologies: this.stringArrayValue(experience.technologies),
      methodologies: this.stringArrayValue(experience.methodologies),
      skills: this.stringArrayValue(experience.skills),
      order: typeof experience.order === 'number' ? experience.order : 0,
      visible: experience.visible !== false,
      featured: Boolean(experience.featured),
    };
  }

  private buildExperienceUpdateData(
    values: ExperienceValues,
  ): Prisma.ExperienceUpdateInput {
    return {
      company: String(values.company ?? ''),
      role: String(values.role ?? ''),
      startDate: new Date(String(values.startDate)),
      endDate: values.endDate ? new Date(String(values.endDate)) : null,
      current: Boolean(values.current),
      location: values.location ? String(values.location) : null,
      modality: values.modality ? String(values.modality) : null,
      description: String(values.description ?? ''),
      achievements: this.stringArrayValue(values.achievements),
      responsibilities: this.stringArrayValue(values.responsibilities),
      technologies: this.stringArrayValue(values.technologies),
      methodologies: this.stringArrayValue(values.methodologies),
      skills: this.stringArrayValue(values.skills),
      order: typeof values.order === 'number' ? values.order : 0,
      visible: Boolean(values.visible),
      featured: Boolean(values.featured),
    };
  }

  private readExperienceDraft(
    draftJson: unknown,
  ): Partial<ExperienceValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = EXPERIENCE_FIELDS.reduce((current, field) => {
      const value = draft[field];
      if (value === undefined) {
        return current;
      }
      if (
        [
          'achievements',
          'responsibilities',
          'technologies',
          'methodologies',
          'skills',
        ].includes(field)
      ) {
        if (Array.isArray(value)) {
          current[field] = this.stringArrayValue(value);
        }
        return current;
      }
      if (['current', 'visible', 'featured'].includes(field)) {
        if (typeof value === 'boolean') {
          current[field] = value;
        }
        return current;
      }
      if (field === 'order') {
        if (typeof value === 'number') {
          current[field] = value;
        }
        return current;
      }
      if (typeof value === 'string' || value === null) {
        current[field] = value;
      }
      return current;
    }, {} as Partial<ExperienceValues>);

    return Object.keys(values).length ? values : null;
  }

  private pickProjectValues(project: Record<string, unknown>): ProjectValues {
    return {
      name: this.stringValue(project.name),
      slug: this.stringValue(project.slug),
      description: this.stringValue(project.description),
      status: this.publishStatusValue(project.status),
      categoryId:
        typeof project.categoryId === 'string' ? project.categoryId : null,
      categoryName:
        typeof project.categoryName === 'string' ? project.categoryName : null,
      technologies: this.stringArrayValue(project.technologies),
      imageUrl: typeof project.imageUrl === 'string' ? project.imageUrl : null,
      publicUrl:
        typeof project.publicUrl === 'string' ? project.publicUrl : null,
      repositoryUrl:
        typeof project.repositoryUrl === 'string'
          ? project.repositoryUrl
          : null,
      featured: Boolean(project.featured),
      visible: project.visible !== false,
      sample: Boolean(project.sample),
      order: typeof project.order === 'number' ? project.order : 0,
    };
  }

  private buildProjectUpdateData(
    values: ProjectValues,
  ): Prisma.ProjectUpdateInput {
    const data: Prisma.ProjectUpdateInput = {
      name: String(values.name ?? ''),
      slug: String(values.slug ?? ''),
      description: String(values.description ?? ''),
      status: this.publishStatusValue(values.status),
      categoryName: values.categoryName ? String(values.categoryName) : null,
      technologies: this.stringArrayValue(values.technologies),
      imageUrl: values.imageUrl ? String(values.imageUrl) : null,
      publicUrl: values.publicUrl ? String(values.publicUrl) : null,
      repositoryUrl: values.repositoryUrl ? String(values.repositoryUrl) : null,
      featured: Boolean(values.featured),
      visible: Boolean(values.visible),
      sample: Boolean(values.sample),
      order: typeof values.order === 'number' ? values.order : 0,
    };

    data.category = values.categoryId
      ? { connect: { id: String(values.categoryId) } }
      : { disconnect: true };

    return data;
  }

  private readProjectDraft(draftJson: unknown): Partial<ProjectValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = PROJECT_FIELDS.reduce((current, field) => {
      const value = draft[field];
      if (value === undefined) {
        return current;
      }
      if (field === 'technologies') {
        if (Array.isArray(value)) {
          current[field] = this.stringArrayValue(value);
        }
        return current;
      }
      if (['featured', 'visible', 'sample'].includes(field)) {
        if (typeof value === 'boolean') {
          current[field] = value;
        }
        return current;
      }
      if (field === 'order') {
        if (typeof value === 'number') {
          current[field] = value;
        }
        return current;
      }
      if (field === 'status') {
        if (typeof value === 'string' && PROJECT_STATUSES.has(value)) {
          current[field] = value;
        }
        return current;
      }
      if (typeof value === 'string' || value === null) {
        current[field] = value;
      }
      return current;
    }, {} as Partial<ProjectValues>);

    return Object.keys(values).length ? values : null;
  }

  private pickSkillValues(skill: Record<string, unknown>): SkillValues {
    return {
      name: this.stringValue(skill.name),
      categoryId:
        typeof skill.categoryId === 'string' ? skill.categoryId : null,
      categoryName:
        typeof skill.categoryName === 'string' ? skill.categoryName : null,
      level: typeof skill.level === 'string' ? skill.level : null,
      order: typeof skill.order === 'number' ? skill.order : 0,
      visible: skill.visible !== false,
    };
  }

  private buildSkillUpdateData(values: SkillValues): Prisma.SkillUpdateInput {
    const data: Prisma.SkillUpdateInput = {
      name: String(values.name ?? ''),
      categoryName: values.categoryName ? String(values.categoryName) : null,
      level: values.level ? String(values.level) : null,
      order: typeof values.order === 'number' ? values.order : 0,
      visible: Boolean(values.visible),
    };

    data.category = values.categoryId
      ? { connect: { id: String(values.categoryId) } }
      : { disconnect: true };

    return data;
  }

  private readSkillDraft(draftJson: unknown): Partial<SkillValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = SKILL_FIELDS.reduce((current, field) => {
      const value = draft[field];
      if (value === undefined) {
        return current;
      }
      if (field === 'visible') {
        if (typeof value === 'boolean') {
          current[field] = value;
        }
        return current;
      }
      if (field === 'order') {
        if (typeof value === 'number') {
          current[field] = value;
        }
        return current;
      }
      if (typeof value === 'string' || value === null) {
        current[field] = value;
      }
      return current;
    }, {} as Partial<SkillValues>);

    return Object.keys(values).length ? values : null;
  }

  private pickEducationValues(
    education: Record<string, unknown>,
  ): EducationValues {
    return {
      title: this.stringValue(education.title),
      institution: this.stringValue(education.institution),
      date: this.stringValue(education.date),
      description:
        typeof education.description === 'string'
          ? education.description
          : null,
      type: this.stringValue(education.type),
      certificateUrl:
        typeof education.certificateUrl === 'string'
          ? education.certificateUrl
          : null,
      attachmentId:
        typeof education.attachmentId === 'string'
          ? education.attachmentId
          : null,
      order: typeof education.order === 'number' ? education.order : 0,
      visible: education.visible !== false,
    };
  }

  private buildEducationUpdateData(
    values: EducationValues,
  ): Prisma.EducationUpdateInput {
    return {
      title: String(values.title ?? ''),
      institution: String(values.institution ?? ''),
      date: String(values.date ?? ''),
      description: values.description ? String(values.description) : null,
      type: String(values.type ?? ''),
      certificateUrl: values.certificateUrl
        ? String(values.certificateUrl)
        : null,
      attachmentId: values.attachmentId ? String(values.attachmentId) : null,
      order: typeof values.order === 'number' ? values.order : 0,
      visible: Boolean(values.visible),
    };
  }

  private readEducationDraft(
    draftJson: unknown,
  ): Partial<EducationValues> | null {
    if (
      !draftJson ||
      typeof draftJson !== 'object' ||
      Array.isArray(draftJson)
    ) {
      return null;
    }

    const draft = draftJson as Record<string, unknown>;
    const values = EDUCATION_FIELDS.reduce((current, field) => {
      const value = draft[field];
      if (value === undefined) {
        return current;
      }
      if (field === 'visible') {
        if (typeof value === 'boolean') {
          current[field] = value;
        }
        return current;
      }
      if (field === 'order') {
        if (typeof value === 'number') {
          current[field] = value;
        }
        return current;
      }
      if (typeof value === 'string' || value === null) {
        current[field] = value;
      }
      return current;
    }, {} as Partial<EducationValues>);

    return Object.keys(values).length ? values : null;
  }

  private samePublicationValue(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private stringArrayValue(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private dateValue(value: unknown) {
    if (!value) {
      return null;
    }
    if (
      !(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number'
    ) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private publishStatusValue(value: unknown): PublishStatus {
    return typeof value === 'string' && PROJECT_STATUSES.has(value)
      ? (value as PublishStatus)
      : PublishStatus.draft;
  }
}
