import type { Account } from '@banking/contracts';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { catchError, map, type Observable, of, startWith } from 'rxjs';

import { MoneyPipe } from '../../../shared/money.pipe';
import { StateBlockComponent } from '../../../shared/state-block.component';
import { TransferWizardStore } from '../transfer-wizard.store';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: Account[] }
  | { status: 'error' };

@Component({
  selector: 'bank-source-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, MoneyPipe, StateBlockComponent],
  template: `
    @let state = accounts$ | async;

    @if (!state || state.status === 'loading') {
      <bank-state-block state="loading" label="Loading your accounts" />
    } @else if (state.status === 'error') {
      <bank-state-block
        state="error"
        label="Could not load your accounts"
        description="The account service did not respond. Please try again."
        (retry)="reload()"
      />
    } @else if (state.accounts.length === 0) {
      <bank-state-block
        state="empty"
        label="No accounts available"
        description="You need an active account before you can send money."
      />
    } @else {
      <p class="prompt">Which account should the money come from?</p>
      <ul class="list">
        @for (account of state.accounts; track account.id) {
          <li>
            <button
              type="button"
              class="option"
              [disabled]="account.status !== 'ACTIVE'"
              (click)="select(account)"
            >
              <span class="identity">
                <span class="nickname">{{ account.nickname }}</span>
                <span class="number">{{ account.accountNumber }}</span>
              </span>
              <span class="balance">
                {{ account.availableBalanceMinor | money: account.currency }}
                @if (account.status !== 'ACTIVE') {
                  <span class="status">{{ account.status }}</span>
                }
              </span>
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .prompt {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: #475569;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
      padding: 0.75rem;
      font: inherit;
      text-align: left;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.625rem;
      cursor: pointer;
    }

    .option:hover:not(:disabled) {
      border-color: #93c5fd;
      background: #f8fafc;
    }

    .option:disabled {
      color: #94a3b8;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .option:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }

    .identity {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .nickname {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
    }

    .number {
      font-size: 0.75rem;
      color: #64748b;
      font-variant-numeric: tabular-nums;
    }

    .balance {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .status {
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #b45309;
      text-align: right;
    }
  `,
})
export class SourceStepComponent {
  private readonly store = inject(TransferWizardStore);

  protected accounts$ = this.load();

  protected select(account: Account): void {
    this.store.selectSource(account);
  }

  protected reload(): void {
    this.accounts$ = this.load();
  }

  /**
   * The request is modelled as one observable of a discriminated state, so the
   * template branches on `status` instead of juggling three loose
   * `isLoading` / `error` / `data` flags that can contradict one another.
   */
  private load(): Observable<LoadState> {
    return this.store.accounts().pipe(
      map((accounts) => ({ status: 'ready' as const, accounts })),
      catchError(() => of({ status: 'error' as const })),
      startWith({ status: 'loading' as const }),
    );
  }
}
