import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginate, resolvePage } from './pagination';

describe('resolvePage', () => {
  it('applies defaults when nothing is supplied', () => {
    expect(resolvePage()).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE, skip: 0, take: DEFAULT_PAGE_SIZE });
  });

  it('clamps a page below one', () => {
    expect(resolvePage(0).page).toBe(1);
    expect(resolvePage(-5).skip).toBe(0);
  });

  it('caps an oversized page size instead of rejecting it', () => {
    // A mistyped URL should return a page, not a 400 the user cannot act on —
    // while still bounding the work the database is asked to do.
    expect(resolvePage(1, 10_000).pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('truncates fractional input', () => {
    expect(resolvePage(2.9, 10.7)).toEqual({ page: 2, pageSize: 10, skip: 10, take: 10 });
  });
});

describe('paginate', () => {
  it('reports at least one page when there are no results', () => {
    // "Page 1 of 0" is nonsense in a pager; an empty list is still one page.
    expect(paginate([], 0, resolvePage(1, 20)).totalPages).toBe(1);
  });

  it('rounds a partial last page up', () => {
    expect(paginate([], 21, resolvePage(1, 20)).totalPages).toBe(2);
  });
});
