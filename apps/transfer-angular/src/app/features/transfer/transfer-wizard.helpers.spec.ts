import { describe, expect, it } from 'vitest';

import { stepIndex, stepLabel, toMinorUnits, wizardStepOrder } from './transfer-wizard.store';

describe('wizard step ordering', () => {
  it('runs source → beneficiary → amount → review → result', () => {
    expect(wizardStepOrder).toEqual(['source', 'beneficiary', 'amount', 'review', 'result']);
  });

  it('orders steps monotonically, which the progress indicator depends on', () => {
    const indexes = wizardStepOrder.map(stepIndex);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it('labels every step', () => {
    for (const step of wizardStepOrder) {
      expect(stepLabel(step)).toBeTruthy();
    }
  });
});

describe('toMinorUnits', () => {
  it('converts whole and fractional amounts', () => {
    expect(toMinorUnits(25)).toBe(2_500);
    expect(toMinorUnits(1_500.5)).toBe(150_050);
  });

  it('always produces an integer', () => {
    // 19.99 * 100 is 1998.9999999999998 in binary floating point. Sending that
    // to an API expecting minor units would be rejected — or worse, truncated.
    expect(toMinorUnits(19.99)).toBe(1_999);
    expect(Number.isInteger(toMinorUnits(0.07))).toBe(true);
  });

  it('handles zero', () => {
    expect(toMinorUnits(0)).toBe(0);
  });
});
