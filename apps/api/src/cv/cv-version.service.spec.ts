import { CvVersionService } from './cv-version.service';

describe('CvVersionService', () => {
  it('generates PDF for the selected version and stores media references', async () => {
    const prisma = mockPrisma();
    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: 'cv-version.pdf',
        path: 'generated/cv-version.pdf',
        url: '/generated/cv-version.pdf',
      }),
      generateDocx: jest.fn(),
    };
    const service = new CvVersionService(prisma as never, exporter as never);

    const result = await service.generatePdf('version-1');

    expect(exporter.generatePdf).toHaveBeenCalledWith(
      'version-1',
      { profile: { fullName: 'Abel Valle Rosa' } },
      {
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: { primaryColor: '#0f766e' },
        },
      },
    );
    expect(prisma.cvVersion.update).toHaveBeenCalledWith({
      where: { id: 'version-1' },
      data: { generatedPdfId: 'media-1' },
    });
    expect(result.media.id).toBe('media-1');
  });
});

function mockPrisma() {
  return {
    cvVersion: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'version-1',
        deletedAt: null,
        structuredJson: { profile: { fullName: 'Abel Valle Rosa' } },
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: { primaryColor: '#0f766e' },
        },
      }),
      update: jest.fn().mockResolvedValue({ id: 'version-1' }),
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
