import type { Paginated } from '@banking/contracts';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * Clamping rather than rejecting an oversized `pageSize` keeps a mistyped URL
 * from becoming a 400 the user cannot act on, while still capping the work a
 * single request can ask the database to do.
 */
export function resolvePage(page?: number, pageSize?: number): PageParams {
  const resolvedPage = Math.max(1, Math.trunc(page ?? 1));
  const resolvedSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(pageSize ?? DEFAULT_PAGE_SIZE)));

  return {
    page: resolvedPage,
    pageSize: resolvedSize,
    skip: (resolvedPage - 1) * resolvedSize,
    take: resolvedSize,
  };
}

export function paginate<T>(items: T[], total: number, params: PageParams): Paginated<T> {
  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
