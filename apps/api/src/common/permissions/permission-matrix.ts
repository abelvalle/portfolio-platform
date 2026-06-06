import { UserRole } from '@prisma/client';

export const permissionMatrix: Record<UserRole, string[]> = {
  admin: [
    'read_dashboard',
    'manage_users',
    'manage_settings',
    'manage_portfolio',
    'manage_cv',
    'manage_messages',
    'read_messages',
    'read_analytics',
  ],
  editor: [
    'read_dashboard',
    'manage_portfolio',
    'manage_cv',
    'manage_messages',
    'read_messages',
    'read_analytics',
  ],
  viewer: [
    'read_dashboard',
    'read_portfolio',
    'read_cv',
    'read_messages',
    'read_analytics',
  ],
};

export function roleHasPermissions(
  role: UserRole | undefined,
  requiredPermissions: string[],
) {
  if (!requiredPermissions.length) {
    return true;
  }
  if (!role || !(role in permissionMatrix)) {
    return false;
  }

  const permissions = permissionMatrix[role];
  return requiredPermissions.every((permission) =>
    permissions.includes(permission),
  );
}
