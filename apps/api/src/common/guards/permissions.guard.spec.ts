import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  it('allows users with the required action permission', () => {
    const guard = new PermissionsGuard(mockReflector(['manage_users']));

    expect(guard.canActivate(mockContext(UserRole.admin))).toBe(true);
  });

  it('rejects users without the required action permission', () => {
    const guard = new PermissionsGuard(mockReflector(['manage_users']));

    expect(guard.canActivate(mockContext(UserRole.editor))).toBe(false);
  });

  it('allows routes without explicit permissions', () => {
    const guard = new PermissionsGuard(mockReflector(undefined));

    expect(guard.canActivate(mockContext(UserRole.viewer))).toBe(true);
  });
});

function mockReflector(requiredPermissions: string[] | undefined) {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions),
  } as unknown as Reflector;
}

function mockContext(role: UserRole) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role },
      }),
    }),
  } as unknown as ExecutionContext;
}
