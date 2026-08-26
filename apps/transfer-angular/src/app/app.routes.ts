import type { Routes } from '@angular/router';

import { requirePermission } from './guards/permission.guard';

/**
 * The Transfer domain's internal routes, relative to the base path the shell
 * mounts this remote at (`/banking/transfer`).
 *
 * Route ownership in practice: the shell decides *that* Transfer renders, and
 * this file decides what renders inside it. Neither knows the other's routes.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [requirePermission('TRANSFER_MONEY')],
    loadComponent: () =>
      import('./features/transfer/transfer-wizard.component').then((m) => m.TransferWizardComponent),
  },
  {
    path: 'history',
    canActivate: [requirePermission('VIEW_TRANSACTION')],
    loadComponent: () =>
      import('./features/history/transfer-history.component').then((m) => m.TransferHistoryComponent),
  },
  // Any unknown sub-path belongs to this domain, so this remote answers for it
  // rather than bouncing the user out to the shell's 404.
  { path: '**', redirectTo: '' },
];
