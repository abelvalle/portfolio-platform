import { BadRequestException } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';

describe('ContactMessagesService filters', () => {
  it('applies status and date range to list', async () => {
    const prisma = mockPrisma();
    prisma.contactMessage.findMany.mockResolvedValue([]);
    const service = new ContactMessagesService(
      prisma as never,
      {
        dispatch: jest.fn(),
      } as never,
    );

    await service.list({
      status: 'unread',
      from: '2026-06-01',
      to: '2026-06-05',
    });

    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-05T23:59:59.999Z'),
        },
        deletedAt: null,
        status: 'unread',
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects inverted date ranges', () => {
    const service = new ContactMessagesService(
      mockPrisma() as never,
      {
        dispatch: jest.fn(),
      } as never,
    );

    expect(() =>
      service.list({ from: '2026-06-05', to: '2026-06-01' }),
    ).toThrow(BadRequestException);
  });
});

function mockPrisma() {
  return {
    contactMessage: {
      findMany: jest.fn(),
    },
  };
}
