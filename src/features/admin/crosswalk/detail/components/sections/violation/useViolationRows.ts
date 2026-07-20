import { useEffect, useMemo, useState } from 'react'
import { useCrosswalkViolationListInfinite } from '@/hooks/queries/crosswalk'
import { THAI_MONTHS } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import type { ViolationFilter } from './filter'

// The คน/รถ status filter is applied CLIENT-SIDE (by `name_th`, see
// `filteredRows` below) because the backend `crossing_type` param doesn't
// filter reliably — so we must pull the whole date range before paginating.
// Fetch 100 rows/request (not 10) to keep the number of sequential round-trips
// low: a wide range like เดือนนี้ used to take ~1 request per 10 rows, so a few
// hundred rows meant dozens of serial fetches and a long spinner. At 100/page
// that's a handful of requests. The infinite loop still walks every page, so
// completeness is unaffected even if the backend caps `limit` below 100.
const BACKEND_PAGE_SIZE = 100
const MAX_AUTO_PAGES = 100

// Backend's `name_en` slugs don't consistently carry a person/vehicle keyword,
// but the Thai label always starts with "คน" (person) or "รถ" (vehicle).
export const isVehicleViolation = (nameTh: string): boolean =>
  nameTh.trim().startsWith('รถ')

// Backend timestamp is pre-formatted as "DD/MM/BBBB HH:mm" (Thai BE year).
// Parse it manually — dayjs can't handle the BE year — and reformat the
// date half as "D ก.ค. BBBB" so the whole app renders violation dates the
// same way as chart/tooltip labels.
export const parseViolationTimestamp = (
  ts: string,
): { date: string; time: string } => {
  const [datePart = '', timePart = ''] = (ts ?? '').split(' ')
  const [dd, mm, yyyy] = datePart.split('/')
  const day = parseInt(dd, 10)
  const monthIdx = parseInt(mm, 10) - 1
  if (
    Number.isNaN(day) ||
    Number.isNaN(monthIdx) ||
    monthIdx < 0 ||
    monthIdx > 11 ||
    !yyyy
  ) {
    return { date: datePart, time: timePart }
  }
  const ddPadded = day.toString().padStart(2, '0')
  return { date: `${ddPadded} ${THAI_MONTHS[monthIdx]} ${yyyy}`, time: timePart }
}

interface UseViolationRowsResult {
  pageRows: CrosswalkViolationRow[]
  totalPages: number
  /** Total matching rows (NOT pages) — drives antd Pagination's item count. */
  total: number
  page: number
  setPage: (n: number) => void
  isLoading: boolean
  pageStart: number
}

export const useViolationRows = (
  filter: ViolationFilter,
  pageSize: number,
): UseViolationRowsResult => {
  const { id } = useDetailContext()
  const [page, setPage] = useState(1)

  const filterSig = `${filter.startDate}|${filter.endDate}|${filter.status}`
  const [prevSig, setPrevSig] = useState(filterSig)
  if (prevSig !== filterSig) {
    setPrevSig(filterSig)
    setPage(1)
  }

  const infiniteQuery = useCrosswalkViolationListInfinite({
    solution_id: id,
    start_date: filter.startDate || undefined,
    end_date: filter.endDate || undefined,
    limit: BACKEND_PAGE_SIZE,
  })

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = infiniteQuery
  const pagesFetched = infiniteQuery.data?.pages.length ?? 0
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    if (pagesFetched >= MAX_AUTO_PAGES) return
    fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, pagesFetched])

  const allRawRows = useMemo<CrosswalkViolationRow[]>(
    () => infiniteQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [infiniteQuery.data],
  )

  const filteredRows = useMemo(() => {
    if (filter.status === 'ALL') return allRawRows
    return allRawRows.filter((r) => {
      const vehicle = isVehicleViolation(r.crosswalk.name_th)
      return filter.status === 'VEHICLE_VIOLATION' ? vehicle : !vehicle
    })
  }, [allRawRows, filter.status])

  const pageStart = (page - 1) * pageSize
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const isLoading = infiniteQuery.isLoading || isFetchingNextPage

  return { pageRows, totalPages, total: filteredRows.length, page, setPage, isLoading, pageStart }
}
