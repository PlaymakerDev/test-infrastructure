/**
 * Derives the `scroll.y` value that AntD `<Table>` expects (numeric px)
 * from a measured container height. The container is the flex-1 area
 * hosting filters + table + pagination, so we subtract the filter row
 * and pagination row overhead to leave the body a scrollable region
 * that always fits inside the viewport.
 *
 * The lower bound of 200px keeps the table readable on very short
 * viewports (e.g. an inspector panel pinned open on a laptop).
 */
export function calcTableScrollY(
  containerHeight: number,
  filtersHeight = 88,
  paginationHeight = 56,
) {
  return Math.max(200, containerHeight - filtersHeight - paginationHeight - 24)
}
