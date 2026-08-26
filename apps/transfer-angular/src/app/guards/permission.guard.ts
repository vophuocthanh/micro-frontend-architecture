import type { Permission } from '@banking/contracts';
import type { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

import { SHELL_CONTEXT } from '../core/shell-context.token';

/**
 * Blocks a route the user has no permission for.
 *
 * This keeps a customer without `TRANSFER_MONEY` from ever reaching the wizard,
 * but it is not the security control — the API re-checks the same permission on
 * `POST /transfers` and refuses a hand-crafted request regardless of routing.
 */
export function requirePermission(permission: Permission): CanActivateFn {
  return () => inject(SHELL_CONTEXT).auth.hasPermission(permission);
}
