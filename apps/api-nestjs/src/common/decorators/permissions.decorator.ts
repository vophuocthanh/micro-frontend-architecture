import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@banking/contracts';

export const PERMISSIONS_KEY = 'auth:permissions';

/**
 * Declares the permissions a route requires. Enforced server-side by
 * `PermissionsGuard`: hiding a button in a micro frontend is a courtesy to the
 * user, never a security control.
 */
export const RequirePermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, permissions);
