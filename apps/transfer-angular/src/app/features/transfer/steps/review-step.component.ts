import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { MoneyPipe } from '../../../shared/money.pipe';
import { TransferWizardStore } from '../transfer-wizard.store';

/**
 * The last stop before money moves.
 *
 * Every figure here comes from the server's quote rather than from local
 * arithmetic, so what the user approves is exactly what will be charged.
 */
@Component({
  selector: 'bank-review-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe],
  template: `
    @if (draft.quote; as quote) {
      <dl class="summary">
        <div class="row">
          <dt>From</dt>
          <dd>{{ draft.sourceAccount?.nickname }} · {{ draft.sourceAccount?.accountNumber }}</dd>
        </div>
        <div class="row">
          <dt>To</dt>
          <dd>{{ draft.beneficiary?.fullName }} · {{ draft.beneficiary?.bankName }}</dd>
        </div>
        @if (draft.note) {
          <div class="row">
            <dt>Note</dt>
            <dd>{{ draft.note }}</dd>
          </div>
        }
        <div class="row">
          <dt>Amount</dt>
          <dd>{{ quote.amountMinor | money: quote.currency }}</dd>
        </div>
        <div class="row">
          <dt>Fee</dt>
          <dd>{{ quote.feeMinor | money: quote.currency }}</dd>
        </div>
        <div class="row total">
          <dt>Total charged</dt>
          <dd>{{ quote.totalMinor | money: quote.currency }}</dd>
        </div>
      </dl>

      <p class="footnote">
        Balance after transfer:
        {{ quote.sourceAvailableAfterMinor | money: quote.currency }} ·
        Remaining daily limit: {{ quote.dailyRemainingMinor | money: quote.currency }}
      </p>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="actions">
        <button type="button" class="ghost" [disabled]="isSubmitting()" (click)="back()">
          ← Change amount
        </button>
        <button type="button" class="primary" [disabled]="isSubmitting()" (click)="confirm()">
          {{ isSubmitting() ? 'Sending…' : 'Confirm transfer' }}
        </button>
      </div>
    }
  `,
  styles: `
    .summary {
      margin: 0 0 0.75rem;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      border-radius: 0.625rem;
    }

    .row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.375rem 0;
      font-size: 0.875rem;
    }

    .row dt {
      color: #64748b;
    }

    .row dd {
      margin: 0;
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .total {
      margin-top: 0.25rem;
      padding-top: 0.625rem;
      border-top: 1px solid #e2e8f0;
      font-size: 1rem;
    }

    .footnote {
      margin: 0 0 1rem;
      font-size: 0.75rem;
      color: #64748b;
      font-variant-numeric: tabular-nums;
    }

    .error {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      color: #b91c1c;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 0.875rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .primary {
      color: #ffffff;
      background: #16a34a;
      border: 1px solid #16a34a;
    }

    .primary:disabled {
      background: #86efac;
      border-color: #86efac;
      cursor: progress;
    }

    .ghost {
      color: #1d4ed8;
      background: none;
      border: 0;
    }

    button:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }
  `,
})
export class ReviewStepComponent {
  private readonly store = inject(TransferWizardStore);

  protected readonly draft = this.store.snapshot;
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected back(): void {
    this.store.goTo('amount');
  }

  protected confirm(): void {
    this.isSubmitting.set(true);
    this.error.set(null);

    this.store.confirm().subscribe({
      complete: () => {
        this.isSubmitting.set(false);
        this.error.set(this.store.snapshot.error);
      },
    });
  }
}
