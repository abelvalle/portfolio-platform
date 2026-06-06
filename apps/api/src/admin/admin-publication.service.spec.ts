import { BadRequestException } from '@nestjs/common';
import { AdminPublicationService } from './admin-publication.service';

describe('AdminPublicationService', () => {
  it('builds a field-level theme draft review', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        theme: {
          id: 'theme-1',
          primaryColor: '#111111',
          secondaryColor: '#222222',
          backgroundColor: '#000000',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          borderRadius: '8px',
          cardStyle: 'subtle',
          animationIntensity: 'medium',
          colorMode: 'dark',
          publishedAt: null,
          draftJson: { primaryColor: '#123456', fontFamily: 'Manrope' },
        },
      }),
    );

    const review = await service.themeReview();

    expect(review.hasDraft).toBe(true);
    expect(review.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'primaryColor',
          before: '#111111',
          after: '#123456',
          changed: true,
        }),
      ]),
    );
  });

  it('rejects publishing when the draft has no changes', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        theme: {
          id: 'theme-1',
          primaryColor: '#111111',
          secondaryColor: '#222222',
          backgroundColor: '#000000',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          borderRadius: '8px',
          cardStyle: 'subtle',
          animationIntensity: 'medium',
          colorMode: 'dark',
          draftJson: { primaryColor: '#111111' },
        },
      }),
    );

    await expect(service.publishThemeDraft('user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('builds a field-level profile draft review', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        profile: profileFixture({
          headline: 'IT Project Manager',
          draftJson: { headline: 'Delivery Manager' },
        }),
      }),
    );

    const review = await service.profileReview();

    expect(review.hasDraft).toBe(true);
    expect(review.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'headline',
          before: 'IT Project Manager',
          after: 'Delivery Manager',
          changed: true,
        }),
      ]),
    );
  });

  it('publishes profile drafts and logs the changed fields', async () => {
    const prisma = mockPrisma({
      profile: profileFixture({
        headline: 'IT Project Manager',
        draftJson: { headline: 'Delivery Manager' },
      }),
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.publishProfileDraft('user-1');

    expect(result.changedFields).toEqual(['headline']);
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ headline: 'Delivery Manager' }),
      }),
    );
    expect(prisma.changeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'profile',
          action: 'publish',
        }),
      }),
    );
  });

  it('rejects profile drafts that clear required fields', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        profile: profileFixture({
          draftJson: { fullName: '' },
        }),
      }),
    );

    await expect(service.publishProfileDraft('user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('builds a field-level experience draft review', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        experience: experienceFixture({
          role: 'IT Project Manager',
          draftJson: { role: 'Delivery Manager', skills: ['UAT', 'KPIs'] },
        }),
      }),
    );

    const review = await service.experienceReview('experience-1');

    expect(review.hasDraft).toBe(true);
    expect(review.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'role',
          before: 'IT Project Manager',
          after: 'Delivery Manager',
          changed: true,
        }),
      ]),
    );
  });

  it('publishes experience drafts and logs changed fields', async () => {
    const prisma = mockPrisma({
      experience: experienceFixture({
        role: 'IT Project Manager',
        draftJson: { role: 'Delivery Manager', skills: ['UAT', 'KPIs'] },
      }),
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.publishExperienceDraft(
      'experience-1',
      'user-1',
    );

    expect(result.changedFields).toEqual(['role', 'skills']);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'Delivery Manager',
          draftJson: expect.anything(),
        }),
      }),
    );
    expect(prisma.changeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'experience',
          action: 'publish',
        }),
      }),
    );
  });

  it('builds a field-level project draft review', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        project: projectFixture({
          description: 'Portfolio publico.',
          draftJson: {
            description: 'Portfolio publico con CV Manager.',
            technologies: ['Next.js', 'NestJS'],
          },
        }),
      }),
    );

    const review = await service.projectReview('project-1');

    expect(review.hasDraft).toBe(true);
    expect(review.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'description',
          before: 'Portfolio publico.',
          after: 'Portfolio publico con CV Manager.',
          changed: true,
        }),
      ]),
    );
  });

  it('publishes project drafts and logs changed fields', async () => {
    const prisma = mockPrisma({
      project: projectFixture({
        description: 'Portfolio publico.',
        draftJson: {
          description: 'Portfolio publico con CV Manager.',
          technologies: ['Next.js', 'NestJS'],
          featured: true,
        },
      }),
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.publishProjectDraft('project-1', 'user-1');

    expect(result.changedFields).toEqual([
      'description',
      'technologies',
      'featured',
    ]);
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Portfolio publico con CV Manager.',
          draftJson: expect.anything(),
        }),
      }),
    );
    expect(prisma.changeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'project',
          action: 'publish',
        }),
      }),
    );
  });

  it('builds a field-level skill draft review', async () => {
    const service = new AdminPublicationService(
      mockPrisma({
        skill: skillFixture({
          level: 'Avanzado',
          draftJson: { level: 'Experto', visible: false },
        }),
      }),
    );

    const review = await service.skillReview('skill-1');

    expect(review.hasDraft).toBe(true);
    expect(review.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'level',
          before: 'Avanzado',
          after: 'Experto',
          changed: true,
        }),
      ]),
    );
  });

  it('publishes skill drafts and logs changed fields', async () => {
    const prisma = mockPrisma({
      skill: skillFixture({
        level: 'Avanzado',
        draftJson: { level: 'Experto', visible: false },
      }),
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.publishSkillDraft('skill-1', 'user-1');

    expect(result.changedFields).toEqual(['level', 'visible']);
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          level: 'Experto',
          visible: false,
          draftJson: expect.anything(),
        }),
      }),
    );
    expect(prisma.changeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'skill',
          action: 'publish',
        }),
      }),
    );
  });

  it('restores theme values from a changelog entry', async () => {
    const prisma = mockPrisma({
      theme: {
        id: 'theme-1',
        primaryColor: '#222222',
        secondaryColor: '#222222',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: '8px',
        cardStyle: 'subtle',
        animationIntensity: 'medium',
        colorMode: 'dark',
      },
      change: {
        id: 'change-1',
        entityType: 'theme',
        entityId: 'theme-1',
        beforeJson: {
          primaryColor: '#111111',
          secondaryColor: '#222222',
          backgroundColor: '#000000',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          borderRadius: '8px',
          cardStyle: 'subtle',
          animationIntensity: 'medium',
          colorMode: 'dark',
        },
      },
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.restoreThemeChange('change-1', 'user-1');

    expect(result.changedFields).toEqual(['primaryColor']);
    expect(prisma.themeSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ primaryColor: '#111111' }),
      }),
    );
  });

  it('restores experience values from a changelog entry', async () => {
    const prisma = mockPrisma({
      experience: experienceFixture({ role: 'Delivery Manager' }),
      change: {
        id: 'change-experience-1',
        entityType: 'experience',
        entityId: 'experience-1',
        beforeJson: experienceSnapshot({ role: 'IT Project Manager' }),
      },
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.restorePublicationChange(
      'change-experience-1',
      'user-1',
    );

    expect(result.changedFields).toEqual(['role']);
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'IT Project Manager' }),
      }),
    );
  });

  it('restores project values from a changelog entry', async () => {
    const prisma = mockPrisma({
      project: projectFixture({ description: 'Version nueva.' }),
      change: {
        id: 'change-project-1',
        entityType: 'project',
        entityId: 'project-1',
        beforeJson: projectSnapshot({ description: 'Version anterior.' }),
      },
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.restorePublicationChange(
      'change-project-1',
      'user-1',
    );

    expect(result.changedFields).toEqual(['description']);
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: 'Version anterior.' }),
      }),
    );
  });

  it('restores skill values from a changelog entry', async () => {
    const prisma = mockPrisma({
      skill: skillFixture({ level: 'Experto' }),
      change: {
        id: 'change-skill-1',
        entityType: 'skill',
        entityId: 'skill-1',
        beforeJson: skillSnapshot({ level: 'Avanzado' }),
      },
    });
    const service = new AdminPublicationService(prisma);

    const result = await service.restorePublicationChange(
      'change-skill-1',
      'user-1',
    );

    expect(result.changedFields).toEqual(['level']);
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ level: 'Avanzado' }),
      }),
    );
  });
});

function mockPrisma({
  theme,
  profile,
  experience,
  project,
  skill,
  change,
}: {
  theme?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  experience?: Record<string, unknown>;
  project?: Record<string, unknown>;
  skill?: Record<string, unknown>;
  change?: Record<string, unknown>;
}) {
  return {
    themeSettings: {
      findFirst: jest.fn().mockResolvedValue(theme),
      findUnique: jest.fn().mockResolvedValue(theme),
      update: jest.fn().mockResolvedValue(theme),
    },
    profile: {
      findFirst: jest.fn().mockResolvedValue(profile),
      findUnique: jest.fn().mockResolvedValue(profile),
      update: jest.fn().mockResolvedValue(profile),
    },
    experience: {
      findUnique: jest.fn().mockResolvedValue(experience),
      update: jest.fn().mockResolvedValue(experience),
    },
    project: {
      findUnique: jest.fn().mockResolvedValue(project),
      update: jest.fn().mockResolvedValue(project),
    },
    skill: {
      findUnique: jest.fn().mockResolvedValue(skill),
      update: jest.fn().mockResolvedValue(skill),
    },
    changeLog: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(change),
    },
    auditLog: {
      create: jest.fn(),
    },
  } as never;
}

function profileFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    fullName: 'Abel Valle Rosa',
    headline: 'IT Project Manager',
    subtitle: 'Delivery Manager',
    shortBio: 'Short bio',
    longBio: 'Long bio',
    location: 'Zaragoza',
    availability: 'Disponible',
    email: 'abel@example.com',
    phone: null,
    linkedin: null,
    github: null,
    website: null,
    avatarUrl: null,
    cvUrl: null,
    seoTitle: null,
    seoDescription: null,
    ogImageUrl: null,
    primaryLanguage: 'es',
    ctaPrimary: 'Descargar CV',
    ctaSecondary: 'Contactar',
    publishedAt: null,
    draftJson: null,
    ...overrides,
  };
}

function experienceFixture(overrides: Record<string, unknown> = {}) {
  return {
    ...experienceSnapshot(),
    id: 'experience-1',
    current: false,
    order: 0,
    visible: true,
    featured: false,
    draftJson: null,
    publishedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function experienceSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    company: 'Empresa real',
    role: 'IT Project Manager',
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: null,
    location: 'Zaragoza',
    modality: 'hibrido',
    description: 'Gestion de proyectos IT.',
    achievements: ['Mejora de reporting'],
    responsibilities: ['Coordinar UAT'],
    technologies: ['Cloud'],
    methodologies: ['Agile'],
    skills: ['Stakeholders'],
    ...overrides,
  };
}

function projectFixture(overrides: Record<string, unknown> = {}) {
  return {
    ...projectSnapshot(),
    id: 'project-1',
    featured: false,
    visible: true,
    sample: false,
    order: 0,
    draftJson: null,
    publishedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function projectSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Portfolio Platform',
    slug: 'portfolio-platform',
    description: 'Portfolio publico.',
    status: 'published',
    categoryId: null,
    categoryName: 'Portfolio',
    technologies: ['Next.js'],
    imageUrl: null,
    publicUrl: null,
    repositoryUrl: null,
    ...overrides,
  };
}

function skillFixture(overrides: Record<string, unknown> = {}) {
  return {
    ...skillSnapshot(),
    id: 'skill-1',
    order: 0,
    visible: true,
    draftJson: null,
    publishedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function skillSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Scrum',
    categoryId: null,
    categoryName: 'Agile',
    level: 'Avanzado',
    ...overrides,
  };
}
