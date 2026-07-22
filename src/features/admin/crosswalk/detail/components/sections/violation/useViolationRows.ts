import { useState } from 'react'
import { useCrosswalkViolationList } from '@/hooks/queries/crosswalk'
import { THAI_MONTHS } from '@/utils/thaiDate'
import { useDetailContext } from '../../../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import { CROSSING_TYPE_MAP, type ViolationFilter } from './filter'

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
  /** All rows matching the current filter (every fetched page, unpaginated)
   *  — feeds the นำออกเอกสาร export, which prints the whole filtered set. */
  allRows: CrosswalkViolationRow[]
  totalPages: number
  /** Total matching rows (NOT pages) — drives antd Pagination's item count. */
  total: number
  /** Server-reported TRUE total for the date range (before the client-side
   *  status filter and before the MAX_AUTO_PAGES walk cap) — can be far
   *  larger than `total` on wide ranges (e.g. 110k rows @1,110 pages). */
  serverTotal: number | null
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

  // Every status pages SERVER-SIDE, one page at a time: `crosswalk_type`
  // (2=คน, 3=รถ per CROSSING_TYPE_MAP) filters on the backend — verified live
  // 2026-07-21 (2→939 คน / 3→14,263 รถ, partitioning the 15,202 baseline
  // exactly). NOTE the param NAME: the old code sent `crossing_type`, which
  // the backend silently ignored — that typo was the entire reason this hook
  // used to walk the whole range client-side.
  const crosswalkType =
    filter.status === 'ALL' ? undefined : CROSSING_TYPE_MAP[filter.status]

  const pageQuery = useCrosswalkViolationList({
    solution_id: id,
    start_date: filter.startDate || undefined,
    end_date: filter.endDate || undefined,
    crosswalk_type: crosswalkType,
    limit: pageSize,
    page,
  })

  const pageStart = (page - 1) * pageSize
  const rows = pageQuery.data?.rows ?? []
  const serverCount = pageQuery.data?.count ?? rows.length

  return {
    pageRows: rows,
    // Only the CURRENT page lives here — callers that need the full set (the
    // export's ทั้งหมด scope) fetch it themselves via fetchViolationPages.
    allRows: rows,
    totalPages: pageQuery.data?.totalPages ?? Math.max(1, Math.ceil(serverCount / pageSize)),
    total: serverCount,
    serverTotal: pageQuery.data?.count ?? null,
    page,
    setPage,
    isLoading: pageQuery.isLoading || pageQuery.isFetching,
    pageStart,
  }
}
