import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { ContactMessagesService } from './contact-messages.service';

describe('ContactMessagesService filters', () => {
  it('applies status and date range to list', async () => {
    const prisma = mockPrisma();
    prisma.contactMessage.findMany.mockResolvedValue([]);
    const service = createService(prisma);

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
    const service = createService(mockPrisma());

    expect(() =>
      service.list({ from: '2026-06-05', to: '2026-06-01' }),
    ).toThrow(BadRequestException);
  });

  it('exports filtered contact messages as privacy-safe CSV', async () => {
    const prisma = mockPrisma();
    prisma.contactMessage.findMany.mockResolvedValue([
      {
        id: 'message-1',
        name: 'Recruiter "Demo"',
        email: 'recruiter@example.com',
        subject: 'Oferta PM',
        message: 'Podemos hablar esta semana?',
        status: 'unread',
        createdAt: new Date('2026-06-06T08:00:00.000Z'),
      },
    ]);
    const service = createService(prisma);

    const csv = await service.exportCsv({ status: 'unread' });

    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: 'unread',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(csv).toBe(
      '"name","email","subject","status","createdAt","message"\n' +
        '"Recruiter ""Demo""","recruiter@example.com","Oferta PM","unread","2026-06-06T08:00:00.000Z","Podemos hablar esta semana?"',
    );
    expect(csv).not.toContain('ipHash');
    expect(csv).not.toContain('userAgent');
  });

  it('salts contact IP hash and can drop user agent storage', async () => {
    const prisma = mockPrisma();
    prisma.contactMessage.create.mockResolvedValue({ id: 'message-1' });
    const service = createService(prisma, {
      CONTACT_IP_HASH_SALT: 'contact-salt',
      CONTACT_STORE_USER_AGENT: 'false',
    });

    await service.create(
      {
        name: '<b>Abel</b>',
        email: 'ABEL@EXAMPLE.COM',
        subject: 'Hola',
        message: '<script>alert(1)</script>Mensaje',
      },
      '127.0.0.1',
      'ua',
    );

    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Abel',
        email: 'abel@example.com',
        ipHash: createHash('sha256')
          .update('contact-salt:127.0.0.1')
          .digest('hex'),
        userAgent: null,
      }),
    });
  });
});

function createService(
  prisma: ReturnType<typeof mockPrisma>,
  config: Record<string, string> = {},
) {
  return new ContactMessagesService(
    prisma as never,
    { dispatch: jest.fn() } as never,
    mockConfig(config),
  );
}

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function mockPrisma() {
  return {
    contactMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}
