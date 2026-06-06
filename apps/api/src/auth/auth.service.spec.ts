import { AuthService } from './auth.service';

describe('AuthService MFA audit', () => {
  it('audits MFA setup without storing the secret in audit metadata', async () => {
    const prisma = mockPrisma(userFixture({ mfaEnabled: false }));
    const service = createService(prisma);

    await service.setupMfa('user-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'auth.mfa.setup_started',
        resource: 'User',
        resourceId: 'user-1',
        metadata: { status: 'pending_confirmation' },
      }),
    });
  });

  it('audits MFA confirmation with recovery code count only', async () => {
    const prisma = mockPrisma(userFixture({ mfaSecret: 'SECRET' }));
    const service = createService(prisma);

    await service.confirmMfa('user-1', '123456');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'auth.mfa.confirmed',
        metadata: { recoveryCodesIssued: 2 },
      }),
    });
  });

  it('audits MFA disable after a valid code', async () => {
    const prisma = mockPrisma(
      userFixture({ mfaEnabled: true, mfaSecret: 'SECRET' }),
    );
    const service = createService(prisma);

    await service.disableMfa('user-1', '123456');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'auth.mfa.disabled',
        metadata: {},
      }),
    });
  });
});

function createService(prisma: ReturnType<typeof mockPrisma>) {
  const jwtService = {};
  const configService = { get: jest.fn() };
  const mfaService = {
    generateSecret: jest.fn().mockReturnValue('SECRET'),
    buildOtpAuthUrl: jest.fn().mockReturnValue('otpauth://totp/test'),
    verifyTotp: jest.fn().mockReturnValue(true),
    generateRecoveryCodes: jest.fn().mockReturnValue(['CODE-ONE', 'CODE-TWO']),
  };

  return new AuthService(
    prisma as never,
    jwtService as never,
    configService as never,
    mfaService as never,
  );
}

function mockPrisma(user: Record<string, unknown>) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(user),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
}

function userFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'abel@example.com',
    name: 'Abel',
    role: 'admin',
    passwordHash: 'hash',
    refreshTokenHash: null,
    mfaEnabled: false,
    mfaSecret: null,
    mfaConfirmedAt: null,
    mfaLastUsedAt: null,
    mfaRecoveryCodeHashes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
