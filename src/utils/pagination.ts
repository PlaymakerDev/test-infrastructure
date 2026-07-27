/** Offset of a page's first row within the full result set — (page - 1) * pageSize.
 *  Shared so every table computes it the same way instead of re-deriving it inline. */
export const getPageOffset = (page: number, pageSize: number): number => (page - 1) * pageSize

/** 1-based row number for `index` within `page`, continuing across pages instead
 *  of resetting to 1 on every page — for a table's ลำดับ column when the
 *  dataSource only holds the current page's rows (server-side pagination). */
export const getRowNumber = (page: number, pageSize: number, index: number): number =>
  getPageOffset(page, pageSize) + index + 1
