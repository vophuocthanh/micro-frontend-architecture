import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SHELL_CONTEXT } from '../../../core/shell-context.token';
import { MoneyPipe } from '../../../shared/money.pipe';
import { TransferWizardStore } from '../transfer-wizard.store';

@Component({
  selector: 'bank-result-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe],
  template: `
    @if (transfer; as result) {
      <div class="result" role="status">
        <span class="badge" [class.failed]="result.status === 'FAILED'" aria-hidden="true">
          {{ result.status === 'FAILED' ? '!' : '✓' }}
        </span>

        <h4 class="headline">
          {{ result.status === 'FAILED' ? 'Transfer failed' : 'Transfer sent' }}
        </h4>

        <p class="detail">
          {{ result.amountMinor | money: result.currency }} to {{ result.beneficiaryName }}
        </p>

        @if (result.failureReason) {
          <p class="reason">{{ result.failureReason }}</p>
        }

        <p class="reference">Reference {{ result.reference }}</p>

        <div class="actions">
          <button type="button" class="primary" (click)="startAnother()">
            Make another transfer
          </button>
          <!-- The return leg of the hand-off. This component names an
               application, never a URL, so it stays ignorant of where the
               Account domain is mounted — or that it is written in Vue. -->
          <button type="button" class="secondary" (click)="viewSourceAccount()">
            View the account it came from
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .result {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1.5rem 1rem;
      text-align: center;
    }

    .badge {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      margin-bottom: 0.375rem;
      font-size: 1.375rem;
      font-weight: 700;
      color: #ffffff;
      background: #16a34a;
      border-radius: 999px;
    }

    .badge.failed {
      background: #dc2626;
    }

    .headline {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 700;
      color: #0f172a;
    }

    .detail {
      margin: 0;
      font-size: 0.9375rem;
      color: #334155;
      font-variant-numeric: tabular-nums;
    }

    .reason {
      margin: 0;
      font-size: 0.8125rem;
      color: #b91c1c;
    }

    .reference {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.875rem;
    }

    .primary {
      padding: 0.5rem 0.875rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: #ffffff;
      background: #1d4ed8;
      border: 1px solid #1d4ed8;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .primary:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }

    .secondary {
      padding: 0.5rem 0.875rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1d4ed8;
      background: #ffffff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .secondary:hover {
      background: #eff6ff;
    }

    .secondary:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }
  `,
})
export class ResultStepComponent {
  private readonly store = inject(TransferWizardStore);
  private readonly shell = inject(SHELL_CONTEXT);

  protected readonly transfer = this.store.snapshot.result;

  protected startAnother(): void {
    // A reset mints a new idempotency key, so the next transfer is a genuinely
    // new one rather than a replay of the one just completed.
    this.store.reset();
  }

  /**
   * Sends the user back to the account the money left, in the application that
   * owns accounts.
   *
   * The deep sub-path is the account id, which the Account domain — and only
   * the Account domain — knows how to interpret. This remote supplies the id it
   * already holds and makes no assumption about the route built from it.
   */
  protected viewSourceAccount(): void {
    const sourceAccountId = this.transfer?.sourceAccountId;
    if (!sourceAccountId) return;

    this.shell.navigateToApp('account', `/${sourceAccountId}`);
  }
}
