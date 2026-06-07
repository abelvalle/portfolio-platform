import { TranslationsService } from './translations.service';

describe('TranslationsService', () => {
  it('lists only visible public translations by locale and namespace', async () => {
    const prisma = mockPrisma();
    prisma.translationEntry.findMany.mockResolvedValue([]);
    const service = new TranslationsService(prisma as never);

    await service.list({ locale: 'en', namespace: 'public.hero' }, true);

    expect(prisma.translationEntry.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        locale: 'en',
        namespace: 'public.hero',
        visible: true,
      },
      orderBy: [{ locale: 'asc' }, { namespace: 'asc' }, { key: 'asc' }],
    });
  });

  it('allows admin list to include hidden translations', async () => {
    const prisma = mockPrisma();
    prisma.translationEntry.findMany.mockResolvedValue([]);
    const service = new TranslationsService(prisma as never);

    await service.list({ locale: 'es', includeHidden: 'true' });

    expect(prisma.translationEntry.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, locale: 'es' },
      orderBy: [{ locale: 'asc' }, { namespace: 'asc' }, { key: 'asc' }],
    });
  });

  it('builds a nested public dictionary from translation entries', async () => {
    const prisma = mockPrisma();
    prisma.translationEntry.findMany.mockResolvedValue([
      {
        namespace: 'public.hero',
        key: 'downloadCv',
        value: 'Download resume',
      },
      {
        namespace: 'public.contact.form',
        key: 'submit',
        value: 'Send message',
      },
    ]);
    const service = new TranslationsService(prisma as never);

    const result = await service.dictionary({ locale: 'en' }, true);

    expect(prisma.translationEntry.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        locale: 'en',
        visible: true,
      },
      orderBy: [{ locale: 'asc' }, { namespace: 'asc' }, { key: 'asc' }],
    });
    expect(result).toEqual({
      hero: { downloadCv: 'Download resume' },
      contact: { form: { submit: 'Send message' } },
    });
  });

  it('upserts translations by locale namespace and key', async () => {
    const prisma = mockPrisma();
    prisma.translationEntry.upsert.mockResolvedValue({ id: 'translation-1' });
    const service = new TranslationsService(prisma as never);

    await service.upsert({
      locale: 'en',
      namespace: 'public.hero',
      key: 'downloadCv',
      value: ' Download resume ',
      description: ' CTA ',
      visible: true,
    });

    expect(prisma.translationEntry.upsert).toHaveBeenCalledWith({
      where: {
        locale_namespace_key: {
          locale: 'en',
          namespace: 'public.hero',
          key: 'downloadCv',
        },
      },
      update: {
        value: 'Download resume',
        description: 'CTA',
        visible: true,
      },
      create: {
        locale: 'en',
        namespace: 'public.hero',
        key: 'downloadCv',
        value: 'Download resume',
        description: 'CTA',
        visible: true,
      },
    });
  });

  it('soft deletes translations', async () => {
    const prisma = mockPrisma();
    prisma.translationEntry.findUnique.mockResolvedValue({
      id: 'translation-1',
      deletedAt: null,
    });
    prisma.translationEntry.update.mockResolvedValue({
      id: 'translation-1',
      visible: false,
    });
    const service = new TranslationsService(prisma as never);

    await service.remove('translation-1');

    expect(prisma.translationEntry.update).toHaveBeenCalledWith({
      where: { id: 'translation-1' },
      data: { deletedAt: expect.any(Date), visible: false },
    });
  });
});

function mockPrisma() {
  return {
    translationEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };
}
