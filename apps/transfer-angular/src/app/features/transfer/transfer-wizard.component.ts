import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PanelComponent } from '../../shared/panel.component';
import { AmountStepComponent } from './steps/amount-step.component';
import { BeneficiaryStepComponent } from './steps/beneficiary-step.component';
import { ResultStepComponent } from './steps/result-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { SourceStepComponent } from './steps/source-step.component';
import { TransferWizardStore } from './transfer-wizard.store';
import { WizardProgressComponent } from './wizard-progress.component';

/**
 * Hosts the five-step flow and nothing else.
 *
 * The store is provided *here* rather than at the root, so the draft transfer
 * lives exactly as long as the wizard is on screen — navigating to the history
 * tab and back starts a clean transfer instead of resuming a half-filled one
 * the user has forgotten about.
 */
@Component({
  selector: 'bank-transfer-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TransferWizardStore],
  imports: [
    AmountStepComponent,
    AsyncPipe,
    BeneficiaryStepComponent,
    PanelComponent,
    ResultStepComponent,
    ReviewStepComponent,
    SourceStepComponent,
    WizardProgressComponent,
  ],
  template: `
    @let state = state$ | async;

    @if (state) {
      <bank-panel title="Send money">
        <bank-wizard-progress [current]="state.step" />

        @switch (state.step) {
          @case ('source') {
            <bank-source-step />
          }
          @case ('beneficiary') {
            <bank-beneficiary-step />
          }
          @case ('amount') {
            <bank-amount-step />
          }
          @case ('review') {
            <bank-review-step />
          }
          @case ('result') {
            <bank-result-step />
          }
        }
      </bank-panel>
    }
  `,
})
export class TransferWizardComponent {
  private readonly store = inject(TransferWizardStore);

  protected readonly state$ = this.store.changes;
}
