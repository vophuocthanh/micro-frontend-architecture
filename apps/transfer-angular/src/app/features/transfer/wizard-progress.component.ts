import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { stepIndex, stepLabel, type WizardStep, wizardStepOrder } from './transfer-wizard.store';

/**
 * Shows where the user is in the flow. A five-step money transfer without a
 * progress indicator leaves people unsure how much more is coming — the single
 * most common reason a funds transfer is abandoned halfway.
 */
@Component({
  selector: 'bank-wizard-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="steps">
      @for (step of steps; track step) {
        <li
          class="step"
          [class.done]="isDone(step)"
          [class.active]="step === current()"
          [attr.aria-current]="step === current() ? 'step' : null"
        >
          <span class="marker" aria-hidden="true">{{ indexOf(step) + 1 }}</span>
          <span class="label">{{ labelOf(step) }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .steps {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      margin: 0 0 1.25rem;
      padding: 0;
      list-style: none;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .marker {
      display: grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      background: #f1f5f9;
      border-radius: 999px;
    }

    .done .marker {
      color: #ffffff;
      background: #16a34a;
    }

    .done {
      color: #16a34a;
    }

    .active .marker {
      color: #ffffff;
      background: #1d4ed8;
    }

    .active {
      color: #0f172a;
      font-weight: 600;
    }
  `,
})
export class WizardProgressComponent {
  readonly current = input.required<WizardStep>();

  protected readonly steps = wizardStepOrder;

  private readonly currentIndex = computed(() => stepIndex(this.current()));

  protected indexOf(step: WizardStep): number {
    return stepIndex(step);
  }

  protected labelOf(step: WizardStep): string {
    return stepLabel(step);
  }

  protected isDone(step: WizardStep): boolean {
    return stepIndex(step) < this.currentIndex();
  }
}
