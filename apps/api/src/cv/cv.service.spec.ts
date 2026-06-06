import { CvService } from './cv.service';

describe('CvService public downloads', () => {
  it('exposes section order from the primary CV version', async () => {
    const prisma = mockPrisma();
    const service = new CvService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.getPrimary();

    expect(result).toEqual(
      expect.objectContaining({
        id: 'cv-1',
        sectionOrder: ['summary', 'page-break', 'skills'],
      }),
    );
  });

  it('generates a primary PDF with a public template override', async () => {
    const prisma = mockPrisma();
    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: 'version-1-ats-friendly.pdf',
        path: 'storage/cv/version-1-ats-friendly.pdf',
        url: '/media/generated/version-1-ats-friendly.pdf',
      }),
      generateDocx: jest.fn(),
    };
    const service = new CvService(
      prisma as never,
      {} as never,
      exporter as never,
      {} as never,
    );

    const result = await service.generatePublicPdf('ats-friendly');

    expect(prisma.cv.findFirst).toHaveBeenCalledWith({
      where: { isPrimary: true, deletedAt: null },
      include: {
        sections: { orderBy: { order: 'asc' } },
        versions: { where: { isPrimary: true } },
      },
    });
    expect(prisma.cvTemplate.findFirst).toHaveBeenCalledWith({
      where: { slug: 'ats-friendly', visible: true, deletedAt: null },
    });
    expect(exporter.generatePdf).toHaveBeenCalledWith(
      'version-1',
      { profile: { fullName: 'Abel Valle Rosa' } },
      {
        template: {
          name: 'ATS-friendly',
          slug: 'ats-friendly',
          config: { primaryColor: '#111827', density: 'compact' },
        },
      },
    );
    expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        filename: 'version-1-ats-friendly.pdf',
        metadata: expect.objectContaining({
          publicDownload: true,
          templateOverride: true,
          template: expect.objectContaining({ slug: 'ats-friendly' }),
        }),
      }),
    });
    expect(prisma.cvVersion.update).not.toHaveBeenCalled();
    expect(result.download).toEqual({
      filename: 'version-1-ats-friendly.pdf',
      storageKey: 'storage/cv/version-1-ats-friendly.pdf',
      mimeType: 'application/pdf',
    });
  });
});

function mockPrisma() {
  return {
    cv: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'cv-1',
        versions: [
          {
            structuredJson: {
              sectionOrder: ['summary', 'page-break', 'skills'],
            },
          },
        ],
      }),
    },
    cvVersion: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'version-1',
        cvId: 'cv-1',
        deletedAt: null,
        structuredJson: { profile: { fullName: 'Abel Valle Rosa' } },
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: { primaryColor: '#0f766e' },
        },
      }),
      update: jest.fn(),
    },
    cvTemplate: {
      findFirst: jest.fn().mockResolvedValue({
        name: 'ATS-friendly',
        slug: 'ats-friendly',
        config: { primaryColor: '#111827', density: 'compact' },
      }),
    },
    mediaAsset: {
      create: jest.fn().mockResolvedValue({ id: 'media-1' }),
    },
    cvGeneratedFile: {
      create: jest.fn().mockResolvedValue({
        id: 'generated-1',
        mediaAssetId: 'media-1',
        type: 'pdf',
      }),
    },
  };
}
