import type { MfeMountContext } from '@banking/contracts';
import { InjectionToken } from '@angular/core';

/**
 * The shell's capabilities, supplied once at bootstrap.
 *
 * An injection token rather than a module-level variable: it makes the
 * dependency explicit in every service that needs it, and it means two mounts
 * of this remote get two independent injectors instead of racing over shared
 * module state.
 */
export const SHELL_CONTEXT = new InjectionToken<MfeMountContext>('banking.shell-context');
