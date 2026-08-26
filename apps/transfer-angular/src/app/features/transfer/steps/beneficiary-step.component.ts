import type { Beneficiary } from '@banking/contracts';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { catchError, map, type Observable, of, startWith } from 'rxjs';

import { StateBlockComponent } from '../../../shared/state-block.component';
import { TransferWizardStore } from '../transfer-wizard.store';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; beneficiaries: Beneficiary[] }
  | { status: 'error' };

@Component({
  selector: 'bank-beneficiary-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, StateBlockComponent],
  template: `
    @let state = beneficiaries$ | async;

    @if (!state || state.status === 'loading') {
      <bank-state-block state="loading" label="Loading your payees" />
    } @else if (state.status === 'error') {
      <bank-state-block
        state="error"
        label="Could not load your payees"
        description="The account service did not respond. Please try again."
        (retry)="reload()"
      />
    } @else if (state.beneficiaries.length === 0) {
      <bank-state-block
        state="empty"
        label="No saved payees"
        description="Add a payee in the Accounts area before sending money."
      />
    } @else {
      <p class="prompt">Who are you sending money to?</p>
      <ul class="list">
        @for (beneficiary of state.beneficiaries; track beneficiary.id) {
          <li>
            <button type="button" class="option" (click)="select(beneficiary)">
              <span class="identity">
                <span class="name">
                  {{ beneficiary.fullName }}
                  @if (beneficiary.isFavourite) {
                    <span class="favourite" aria-label="Favourite payee">★</span>
                  }
                </span>
                <span class="meta">
                  {{ beneficiary.bankName }} · {{ beneficiary.accountNumber }}
                </span>
              </span>
            </button>
          </li>
        }
      </ul>
    }

    <button type="button" class="back" (click)="back()">← Change account</button>
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
      width: 100%;
      padding: 0.75rem;
      font: inherit;
      text-align: left;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.625rem;
      cursor: pointer;
    }

    .option:hover {
      border-color: #93c5fd;
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

    .name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
    }

    .favourite {
      color: #d97706;
    }

    .meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .back {
      margin-top: 1rem;
      padding: 0.375rem 0.5rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1d4ed8;
      background: none;
      border: 0;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .back:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }
  `,
})
export class BeneficiaryStepComponent {
  private readonly store = inject(TransferWizardStore);

  protected beneficiaries$ = this.load();

  protected select(beneficiary: Beneficiary): void {
    this.store.selectBeneficiary(beneficiary);
  }

  protected back(): void {
    this.store.goTo('source');
  }

  protected reload(): void {
    this.beneficiaries$ = this.load();
  }

  private load(): Observable<LoadState> {
    return this.store.beneficiaries().pipe(
      map((beneficiaries) => ({ status: 'ready' as const, beneficiaries })),
      catchError(() => of({ status: 'error' as const })),
      startWith({ status: 'loading' as const }),
    );
  }
}
