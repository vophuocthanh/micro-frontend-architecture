import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MoneyPipe } from '../../../shared/money.pipe';
import { toMinorUnits, TransferWizardStore } from '../transfer-wizard.store';

/** Mirrors the API's own floor of $1.00; the server enforces it regardless. */
const MIN_AMOUNT_MAJOR = 1;
const MAX_NOTE_LENGTH = 140;

@Component({
  selector: 'bank-amount-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" novalidate (ngSubmit)="submit()">
      <p class="prompt">
        Sending from <strong>{{ sourceNickname }}</strong> to
        <strong>{{ beneficiaryName }}</strong>
      </p>

      <div class="field">
        <label for="transfer-amount">Amount</label>
        <div class="amount-input">
          <span class="prefix" aria-hidden="true">$</span>
          <input
            id="transfer-amount"
            type="number"
            step="0.01"
            min="1"
            inputmode="decimal"
            formControlName="amount"
            [attr.aria-invalid]="showAmountError()"
            [attr.aria-describedby]="showAmountError() ? 'transfer-amount-error' : 'transfer-amount-hint'"
          />
        </div>
        @if (showAmountError()) {
          <p id="transfer-amount-error" class="error">
            Enter an amount of at least {{ 100 | money }}.
          </p>
        } @else {
          <p id="transfer-amount-hint" class="hint">
            Available: {{ availableMinor | money }}
          </p>
        }
      </div>

      <div class="field">
        <label for="transfer-note">Note <span class="optional">(optional)</span></label>
        <input
          id="transfer-note"
          type="text"
          formControlName="note"
          [maxlength]="maxNoteLength"
          autocomplete="off"
        />
      </div>

      @if (error()) {
        <p class="error form-error" role="alert">{{ error() }}</p>
      }

      <div class="actions">
        <button type="button" class="ghost" (click)="back()">← Change payee</button>
        <button type="submit" class="primary" [disabled]="isQuoting()">
          {{ isQuoting() ? 'Checking…' : 'Continue' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .prompt {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: #475569;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }

    .optional {
      font-weight: 400;
      color: #94a3b8;
    }

    .amount-input {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0 0.625rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
    }

    .amount-input:focus-within {
      outline: 2px solid #1d4ed8;
      outline-offset: -1px;
    }

    .prefix {
      font-size: 1rem;
      font-weight: 600;
      color: #64748b;
    }

    input {
      flex: 1;
      padding: 0.5rem 0;
      font: inherit;
      font-size: 1rem;
      color: #0f172a;
      background: none;
      border: 0;
      font-variant-numeric: tabular-nums;
    }

    input:focus {
      outline: none;
    }

    #transfer-note {
      padding: 0.5rem 0.625rem;
      font-size: 0.875rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
    }

    #transfer-note:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: -1px;
    }

    .hint {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
      font-variant-numeric: tabular-nums;
    }

    .error {
      margin: 0;
      font-size: 0.75rem;
      color: #b91c1c;
    }

    .form-error {
      margin-bottom: 0.75rem;
      font-size: 0.8125rem;
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
      background: #1d4ed8;
      border: 1px solid #1d4ed8;
    }

    .primary:disabled {
      background: #93c5fd;
      border-color: #93c5fd;
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
export class AmountStepComponent {
  private readonly store = inject(TransferWizardStore);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly maxNoteLength = MAX_NOTE_LENGTH;
  protected readonly isQuoting = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly draft = this.store.snapshot;
  protected readonly sourceNickname = this.draft.sourceAccount?.nickname ?? '';
  protected readonly beneficiaryName = this.draft.beneficiary?.fullName ?? '';
  protected readonly availableMinor = this.draft.sourceAccount?.availableBalanceMinor ?? 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    amount: [
      this.draft.amountMinor ? this.draft.amountMinor / 100 : null as number | null,
      [Validators.required, Validators.min(MIN_AMOUNT_MAJOR)],
    ],
    note: [this.draft.note, [Validators.maxLength(MAX_NOTE_LENGTH)]],
  });

  protected showAmountError(): boolean {
    const control = this.form.controls.amount;
    // Only after the user has engaged with the field — flagging an untouched
    // empty input as invalid reads as the form shouting before it was used.
    return control.invalid && (control.touched || control.dirty);
  }

  protected back(): void {
    this.store.goTo('beneficiary');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { amount, note } = this.form.getRawValue();
    if (amount === null) return;

    this.isQuoting.set(true);
    this.error.set(null);

    // The store owns the request; the component only reflects its outcome.
    this.store.requestQuote(toMinorUnits(amount), note).subscribe({
      complete: () => {
        this.isQuoting.set(false);
        this.error.set(this.store.snapshot.error);
      },
    });
  }
}
