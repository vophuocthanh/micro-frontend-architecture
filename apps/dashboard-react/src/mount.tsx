import type { MfeMount } from '@banking/contracts';

import { bootstrapDashboard } from './bootstrap';

/**
 * The federation entry point — the entire public surface of this remote.
 *
 * Deliberately thin: it exists only to satisfy the mount contract, so the one
 * module the shell reaches for stays a stable boundary while everything behind
 * it is free to change. Nothing React-specific crosses this line, which is why
 * the same shell can host a Vue and an Angular application through it.
 */
export const mount: MfeMount = bootstrapDashboard;

/** Reported to the shell so it can show which build of this remote is live. */
export const version: string = __DASHBOARD_VERSION__;
