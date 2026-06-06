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

  it('marks only the selected version as primary within its CV', async () => {
    const prisma = mockPrisma();
    const service = new CvVersionService(prisma as never, {} as never);

    const result = await service.setPrimary('version-1');

    expect(prisma.cvVersion.updateMany).toHaveBeenCalledWith({
      where: { cvId: 'cv-1', deletedAt: null },
      data: { isPrimary: false },
    });
    expect(prisma.cvVersion.update).toHaveBeenCalledWith({
      where: { id: 'version-1' },
      data: { isPrimary: true, status: 'published' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'version-1', isPrimary: true });
  });
});

function mockPrisma() {
  return {
    cvVersion: {
      findUnique: jest.fn().mockResolvedValue({
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
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      update: jest.fn().mockResolvedValue({ id: 'version-1', isPrimary: true }),
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
    $transaction: jest
      .fn()
      .mockImplementation(async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
  };
}
