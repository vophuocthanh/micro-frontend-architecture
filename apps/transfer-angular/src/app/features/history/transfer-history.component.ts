import type { Paginated, Transfer } from '@banking/contracts';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, type Observable, of, startWith, switchMap } from 'rxjs';

import { MoneyPipe } from '../../shared/money.pipe';
import { PanelComponent } from '../../shared/panel.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { TransferService } from '../../services/transfer.service';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; page: Paginated<Transfer> }
  | { status: 'error' };

@Component({
  selector: 'bank-transfer-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, MoneyPipe, PanelComponent, StateBlockComponent],
  template: `
    @let state = history$ | async;

    <bank-panel
      title="Transfer history"
      [hint]="state?.status === 'ready' ? state!.page.total + ' total' : ''"
    >
      @if (!state || state.status === 'loading') {
        <bank-state-block state="loading" label="Loading transfers" />
      } @else if (state.status === 'error') {
        <bank-state-block
          state="error"
          label="Could not load transfers"
          description="The transfer service did not respond. Please try again."
          (retry)="reload()"
        />
      } @else if (state.page.items.length === 0) {
        <bank-state-block
          state="empty"
          label="No transfers yet"
          description="Transfers you send will be listed here."
        />
      } @else {
        <table class="table">
          <caption class="sr-only">Transfers, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Payee</th>
              <th scope="col">Status</th>
              <th scope="col" class="numeric">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (transfer of state.page.items; track transfer.id) {
              <tr>
                <td class="muted">{{ transfer.createdAt | date: 'd MMM y' }}</td>
                <td>
                  <span class="payee">{{ transfer.beneficiaryName }}</span>
                  <span class="reference">{{ transfer.reference }}</span>
                </td>
                <td>
                  <span class="status" [class]="transfer.status.toLowerCase()">
                    {{ transfer.status }}
                  </span>
                </td>
                <td class="numeric">{{ transfer.amountMinor | money: transfer.currency }}</td>
              </tr>
            }
          </tbody>
        </table>

        <nav class="pager" aria-label="Transfer history pages">
          <button type="button" [disabled]="state.page.page <= 1" (click)="goTo(state.page.page - 1)">
            Previous
          </button>
          <span aria-live="polite">Page {{ state.page.page }} of {{ state.page.totalPages }}</span>
          <button
            type="button"
            [disabled]="state.page.page >= state.page.totalPages"
            (click)="goTo(state.page.page + 1)"
          >
            Next
          </button>
        </nav>
      }
    </bank-panel>
  `,
  styles: `
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .table th {
      padding: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 0.625rem 0;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }

    .table tr:last-child td {
      border-bottom: 0;
    }

    .numeric {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .muted {
      color: #64748b;
      white-space: nowrap;
    }

    .payee {
      display: block;
      font-weight: 600;
      color: #0f172a;
    }

    .reference {
      display: block;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .status {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      border-radius: 999px;
    }

    .completed {
      color: #047857;
      background: #d1fae5;
    }

    .pending {
      color: #b45309;
      background: #fef3c7;
    }

    .failed {
      color: #b91c1c;
      background: #fee2e2;
    }

    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .pager button {
      padding: 0.375rem 0.75rem;
      font: inherit;
      font-weight: 600;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .pager button:disabled {
      color: #94a3b8;
      background: #f8fafc;
      border-color: #e2e8f0;
      cursor: not-allowed;
    }

    .pager button:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class TransferHistoryComponent {
  private readonly transfers = inject(TransferService);

  private readonly page$ = new BehaviorSubject(1);

  /**
   * `switchMap`, not `mergeMap`: paging quickly must show the page the user
   * landed on, and a slow earlier response arriving late would otherwise
   * overwrite it.
   */
  protected readonly history$: Observable<LoadState> = this.page$.pipe(
    switchMap((page) =>
      this.transfers.history(page).pipe(
        map((result) => ({ status: 'ready' as const, page: result })),
        catchError(() => of({ status: 'error' as const })),
        startWith({ status: 'loading' as const }),
      ),
    ),
  );

  protected goTo(page: number): void {
    this.page$.next(Math.max(1, page));
  }

  /** Re-emitting the current page is enough to make `switchMap` refetch it. */
  protected reload(): void {
    this.page$.next(this.page$.value);
  }
}
