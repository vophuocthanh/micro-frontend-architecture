import type { CurrencyCode } from '@banking/contracts';
import { Pipe, type PipeTransform } from '@angular/core';

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

/**
 * Renders integer minor units as currency.
 *
 * A pure pipe, so Angular reuses the result until the inputs change — with a
 * transfer history on screen this runs once per row instead of once per change
 * detection pass.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(amountMinor: number | null | undefined, currency: CurrencyCode = 'USD'): string {
    if (amountMinor === null || amountMinor === undefined) return '—';

    let formatter = formatters.get(currency);
    if (!formatter) {
      formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
      formatters.set(currency, formatter);
    }

    return formatter.format(amountMinor / 100);
  }
}
