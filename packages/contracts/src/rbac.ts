/**
 * Role-based access control, shared verbatim by the API and every frontend.
 *
 * Permissions — not roles — are the unit of authorisation: call sites ask
 * "may this user transfer money?", never "is this user a customer?", so the
 * mapping below can change without touching a single guard or component.
 */

export const PERMISSIONS = [
  'VIEW_DASHBOARD',
  'VIEW_ACCOUNT',
  'VIEW_TRANSACTION',
  'TRANSFER_MONEY',
  'MANAGE_BENEFICIARY',
  'MANAGE_USERS',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ['ADMIN', 'STAFF', 'CUSTOMER'] as const;

export type Role = (typeof ROLES)[number];

/**
 * The frontend copy of this table is a UX optimisation only: it decides which
 * affordances to render. The API re-derives permissions from the persisted
 * role on every request and never trusts a client-supplied permission list.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  ADMIN: [
    'VIEW_DASHBOARD',
    'VIEW_ACCOUNT',
    'VIEW_TRANSACTION',
    'TRANSFER_MONEY',
    'MANAGE_BENEFICIARY',
    'MANAGE_USERS',
  ],
  STAFF: ['VIEW_DASHBOARD', 'VIEW_ACCOUNT', 'VIEW_TRANSACTION'],
  CUSTOMER: [
    'VIEW_DASHBOARD',
    'VIEW_ACCOUNT',
    'VIEW_TRANSACTION',
    'TRANSFER_MONEY',
    'MANAGE_BENEFICIARY',
  ],
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(granted: readonly Permission[], required: Permission): boolean {
  return granted.includes(required);
}

export function hasEveryPermission(
  granted: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.every((permission) => granted.includes(permission));
}

export function hasSomePermission(
  granted: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.some((permission) => granted.includes(permission));
}
