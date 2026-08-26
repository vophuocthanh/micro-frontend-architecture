import type { CurrencyCode } from '@banking/contracts';

/**
 * Formatters are created once and reused: constructing an `Intl` formatter is
 * expensive enough that doing it per row shows up on a long transaction list.
 */
const currencyFormatters = new Map<CurrencyCode, Intl.NumberFormat>();

export function formatMoney(amountMinor: number, currency: CurrencyCode): string {
  let formatter = currencyFormatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }

  return formatter.format(amountMinor / 100);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });

export function formatShortDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split('-');
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short' });
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Sentence-cases an enum value: `GROCERIES` → `Groceries`. */
export function humanise(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
