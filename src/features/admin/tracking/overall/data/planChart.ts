import type { ViewSumPlanChartItem } from '@/types/tracking/overall-api'

// Thai abbreviated month → 0-based calendar month index.
const THAI_MONTH_INDEX: Record<string, number> = {
  'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
  'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
}

/**
 * `/dashboards/view_sum_plan_chart` returns all 12 fiscal months (ต.ค.→ก.ย.)
 * with CUMULATIVE plan/result, and for months that haven't happened yet it
 * carries the latest cumulative `result` forward (verified live 2026-08-17:
 * ก.ย. result === ส.ค. result while today was 17 ส.ค.). Plotting that reads
 * as "we already have results for September". `plan` is fine — a plan
 * legitimately covers the whole fiscal year — so only the result series
 * should stop at the current month.
 *
 * Items carry `month` (Thai abbr) + `year` (Buddhist-era string, per-month —
 * ต.ค.–ธ.ค. belong to the previous BE year), so the comparison needs no
 * knowledge of which fiscal year is selected: for past years nothing is ever
 * "future" and the whole series renders.
 */
export const isFuturePlanMonth = (
  item: Pick<ViewSumPlanChartItem, 'month' | 'year'>,
): boolean => {
  const monthIdx = THAI_MONTH_INDEX[item.month?.trim() ?? '']
  const yearCE = parseInt(item.year, 10) - 543
  if (monthIdx == null || Number.isNaN(yearCE)) return false
  const now = new Date()
  return (
    yearCE > now.getFullYear() ||
    (yearCE === now.getFullYear() && monthIdx > now.getMonth())
  )
}
