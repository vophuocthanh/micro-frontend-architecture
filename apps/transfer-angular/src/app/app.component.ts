import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SHELL_CONTEXT } from './core/shell-context.token';

/**
 * The Transfer domain's root: a local tab bar and the router outlet.
 *
 * The tabs are this remote's own navigation, driven by the Angular Router over
 * the shell-owned URL — which is why a link to `/banking/transfer/history`
 * survives a browser refresh.
 */
@Component({
  selector: 'bank-transfer-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (canTransfer || canViewHistory) {
      <nav class="tabs" aria-label="Transfer sections">
        @if (canTransfer) {
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Send money
          </a>
        }
        @if (canViewHistory) {
          <a routerLink="/history" routerLinkActive="active">History</a>
        }
      </nav>

      <router-outlet />
    } @else {
      <div class="denied" role="status">
        <p class="denied-title">Transfers unavailable</p>
        <p>Your role does not include permission to move money.</p>
      </div>
    }
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .tabs a {
      padding: 0.4375rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      text-decoration: none;
      border-radius: 0.5rem;
    }

    .tabs a:hover {
      background: #f1f5f9;
    }

    .tabs a.active {
      color: #1d4ed8;
      background: #eff6ff;
    }

    .tabs a:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }

    .denied {
      padding: 2rem;
      text-align: center;
      color: #64748b;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
    }

    .denied-title {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }
  `,
})
export class AppComponent {
  private readonly auth = inject(SHELL_CONTEXT).auth;

  protected readonly canTransfer = this.auth.hasPermission('TRANSFER_MONEY');
  protected readonly canViewHistory = this.auth.hasPermission('VIEW_TRANSACTION');
}
