import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, letting a later Tailwind utility win over an earlier one
 * in the same category — `cn('p-2', 'p-4')` yields `p-4` rather than both.
 *
 * Every shadcn component takes a `className`, and without this a caller's
 * override would lose to the component's own default half the time depending on
 * stylesheet order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
