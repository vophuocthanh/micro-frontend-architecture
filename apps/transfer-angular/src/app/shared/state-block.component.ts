import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * The loading / empty / error surface shared by every screen in this domain.
 *
 * Angular's default emulated view encapsulation rewrites these selectors with a
 * per-component attribute, which is this remote's CSS isolation strategy — the
 * styles below cannot reach the shell or the React and Vue remotes.
 */
@Component({
  selector: 'bank-state-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state() === 'loading') {
      <div class="block" role="status" aria-live="polite" aria-busy="true">
        <span class="sr-only">{{ label() }}</span>
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
      </div>
    } @else if (state() === 'empty') {
      <div class="block">
        <p class="title">{{ label() }}</p>
        <p class="description">{{ description() }}</p>
      </div>
    } @else {
      <div class="block error" role="alert">
        <p class="title">{{ label() }}</p>
        <p class="description">{{ description() }}</p>
        <button type="button" class="retry" (click)="retry.emit()">Try again</button>
      </div>
    }
  `,
  styles: `
    .block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #334155;
    }

    .error .title {
      color: #b91c1c;
    }

    .description {
      margin: 0;
      max-width: 36ch;
      font-size: 0.875rem;
    }

    .retry {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .retry:focus-visible {
      outline: 2px solid #1d4ed8;
      outline-offset: 2px;
    }

    .skeleton {
      width: 100%;
      height: 1rem;
      border-radius: 0.375rem;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }

    @keyframes shimmer {
      from {
        background-position: 100% 50%;
      }
      to {
        background-position: 0 50%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
      }
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
export class StateBlockComponent {
  readonly state = input.required<'loading' | 'empty' | 'error'>();
  readonly label = input.required<string>();
  readonly description = input('');
  readonly retry = output<void>();
}
