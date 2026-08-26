import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `tailwind-merge` has to be told about the `dash:` prefix, or it stops
 * recognising these as Tailwind classes and `cn('dash:p-2', 'dash:p-4')` keeps
 * both — silently reintroducing the specificity fights the utility approach
 * exists to avoid.
 */
const twMerge = extendTailwindMerge({ prefix: 'dash:' });

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
