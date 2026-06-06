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
});

function mockPrisma({
  theme,
  profile,
  change,
}: {
  theme?: Record<string, unknown>;
  profile?: Record<string, unknown>;
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
