import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  it('allows app module identity fields only during creation', async () => {
    const prisma = createPrismaMock();
    const service = new ResourcesService(prisma as never);

    await service.create('appModule', {
      id: 'ignored-id',
      key: 'future-module',
      name: 'Future module',
      description: 'Optional module',
      enabled: true,
      order: 8,
      createdAt: '2026-06-07T08:00:00.000Z',
    });

    expect(prisma.appModule.create).toHaveBeenCalledWith({
      data: {
        key: 'future-module',
        name: 'Future module',
        description: 'Optional module',
        enabled: true,
        order: 8,
      },
    });
  });

  it('protects app module identity and audit fields during updates', async () => {
    const prisma = createPrismaMock();
    const service = new ResourcesService(prisma as never);

    await service.update('appModule', 'module-1', {
      id: 'other-id',
      key: 'renamed-key',
      name: 'Media',
      enabled: false,
      order: 4,
      updatedAt: '2026-06-07T08:00:00.000Z',
    });

    expect(prisma.appModule.update).toHaveBeenCalledWith({
      where: { id: 'module-1' },
      data: {
        name: 'Media',
        enabled: false,
        order: 4,
      },
    });
  });
});

function createPrismaMock() {
  return {
    appModule: {
      create: jest.fn().mockResolvedValue({ id: 'module-1' }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'module-1',
        key: 'media',
        name: 'Media',
        enabled: true,
      }),
      update: jest.fn().mockResolvedValue({ id: 'module-1' }),
    },
  };
}
