import type { MfeMount } from '@banking/contracts';

import { bootstrapTransfer } from './bootstrap';

/**
 * The federation entry point — the entire public surface of this remote.
 *
 * Deliberately thin: it exists only to satisfy the mount contract, so that the
 * one module the shell reaches for stays a stable boundary while everything
 * behind it is free to change.
 */
export const mount: MfeMount = bootstrapTransfer;

/** Reported to the shell so it can show which build of this remote is live. */
export const version: string = __TRANSFER_VERSION__;
