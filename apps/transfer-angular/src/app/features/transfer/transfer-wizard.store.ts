import type { Account, Beneficiary, Transfer, TransferQuote } from '@banking/contracts';
import { inject, Injectable, type OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, finalize, type Observable, tap } from 'rxjs';

import { SHELL_CONTEXT } from '../../core/shell-context.token';
import { describeError, normaliseError } from '../../services/api-error';
import { TransferService } from '../../services/transfer.service';

export type WizardStep = 'source' | 'beneficiary' | 'amount' | 'review' | 'result';

export interface WizardState {
  step: WizardStep;
  sourceAccount: Account | null;
  beneficiary: Beneficiary | null;
  amountMinor: number;
  note: string;
  quote: TransferQuote | null;
  result: Transfer | null;
  isSubmitting: boolean;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: 'source',
  sourceAccount: null,
  beneficiary: null,
  amountMinor: 0,
  note: '',
  quote: null,
  result: null,
  isSubmitting: false,
  error: null,
};

/**
 * The transfer wizard's state machine.
 *
 * Deliberately a service holding one `BehaviorSubject` rather than state spread
 * across five step components: the flow has an order, a partially-filled draft
 * and a submit that must happen exactly once, and all three are far easier to
 * reason about — and to test — as a single transition function.
 */
@Injectable()
export class TransferWizardStore implements OnDestroy {
  private readonly transfers = inject(TransferService);
  private readonly shell = inject(SHELL_CONTEXT);

  private readonly state$ = new BehaviorSubject<WizardState>(INITIAL_STATE);

  /**
   * A single idempotency key per attempt, minted when the draft is complete.
   *
   * Reusing it across retries is the entire point: if the network drops after
   * the API committed the transfer, the retry returns the original instead of
   * sending the money twice.
   */
  private idempotencyKey = crypto.randomUUID();

  private readonly unsubscribeAccountSelected = this.shell.events.on('account:selected', (event) => {
    // Another micro frontend told us which account the user is working with.
    // Pre-selecting it is a courtesy — the user can still change it.
    if (this.snapshot.step === 'source') {
      this.selectSourceById(event.payload.accountId);
    }
  });

  private pendingSourceAccountId: string | null = null;

  readonly changes: Observable<WizardState> = this.state$.asObservable();

  get snapshot(): WizardState {
    return this.state$.value;
  }

  accounts(): Observable<Account[]> {
    return this.transfers.listAccounts().pipe(
      tap((accounts) => {
        if (this.pendingSourceAccountId) {
          const match = accounts.find((account) => account.id === this.pendingSourceAccountId);
          if (match) this.selectSource(match);
          this.pendingSourceAccountId = null;
        }
      }),
    );
  }

  beneficiaries(): Observable<Beneficiary[]> {
    return this.transfers.listBeneficiaries();
  }

  selectSource(account: Account): void {
    this.patch({ sourceAccount: account, step: 'beneficiary', error: null });
  }

  selectBeneficiary(beneficiary: Beneficiary): void {
    this.patch({ beneficiary, step: 'amount', error: null });
  }

  goTo(step: WizardStep): void {
    this.patch({ step, error: null });
  }

  /**
   * Moves to the review step, but only once the server has priced the transfer.
   * Showing a locally-guessed fee and then charging a different one is exactly
   * the kind of surprise a banking UI must not produce.
   */
  requestQuote(amountMinor: number, note: string): Observable<TransferQuote> {
    const { sourceAccount, beneficiary } = this.snapshot;

    if (!sourceAccount || !beneficiary) {
      throw new Error('Cannot quote before a source account and beneficiary are chosen');
    }

    this.patch({ amountMinor, note, error: null });

    return this.transfers
      .quote({ sourceAccountId: sourceAccount.id, beneficiaryId: beneficiary.id, amountMinor })
      .pipe(
        tap((quote) => this.patch({ quote, step: 'review' })),
        catchError((error: unknown) => {
          this.patch({ error: describeError(normaliseError(error)) });
          return EMPTY;
        }),
      );
  }

  confirm(): Observable<Transfer> {
    const { sourceAccount, beneficiary, amountMinor, note } = this.snapshot;

    if (!sourceAccount || !beneficiary) {
      throw new Error('Cannot confirm an incomplete transfer');
    }

    this.patch({ isSubmitting: true, error: null });

    return this.transfers
      .create({
        sourceAccountId: sourceAccount.id,
        beneficiaryId: beneficiary.id,
        amountMinor,
        idempotencyKey: this.idempotencyKey,
        ...(note ? { note } : {}),
      })
      .pipe(
        tap((transfer) => {
          this.patch({ result: transfer, step: 'result' });
          // Tell the platform, not the other applications: Dashboard and
          // Account both refresh their balances off this event, and neither is
          // named here.
          this.shell.events.emit('transfer:completed', {
            transferId: transfer.id,
            sourceAccountId: transfer.sourceAccountId,
            amountMinor: transfer.amountMinor,
            currency: transfer.currency,
            status: transfer.status,
          });
          this.shell.events.emit('notification:show', {
            level: 'success',
            message: `${transfer.reference} sent to ${transfer.beneficiaryName}.`,
          });
        }),
        catchError((error: unknown) => {
          this.patch({ error: describeError(normaliseError(error)) });
          return EMPTY;
        }),
        finalize(() => this.patch({ isSubmitting: false })),
      );
  }

  /** Starts a fresh transfer — including a fresh idempotency key. */
  reset(): void {
    this.idempotencyKey = crypto.randomUUID();
    this.state$.next(INITIAL_STATE);
  }

  ngOnDestroy(): void {
    this.unsubscribeAccountSelected();
    this.state$.complete();
  }

  private selectSourceById(accountId: string): void {
    const current = this.snapshot.sourceAccount;
    if (current?.id === accountId) return;
    // The account list may not have loaded yet; remember the intent and apply
    // it when it arrives.
    this.pendingSourceAccountId = accountId;
  }

  private patch(partial: Partial<WizardState>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }
}

export const wizardStepOrder: readonly WizardStep[] = [
  'source',
  'beneficiary',
  'amount',
  'review',
  'result',
];

export function stepIndex(step: WizardStep): number {
  return wizardStepOrder.indexOf(step);
}

export function stepLabel(step: WizardStep): string {
  return { source: 'Account', beneficiary: 'Payee', amount: 'Amount', review: 'Review', result: 'Done' }[
    step
  ];
}

export function toMinorUnits(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}
