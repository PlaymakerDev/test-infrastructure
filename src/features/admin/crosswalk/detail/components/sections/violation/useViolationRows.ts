import { useEffect, useMemo, useState } from 'react'
import { useCrosswalkViolationListInfinite } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import type { ViolationFilter } from './filter'

const BACKEND_PAGE_SIZE = 10
const MAX_AUTO_PAGES = 100

// Backend's `name_en` slugs don't consistently carry a person/vehicle keyword,
// but the Thai label always starts with "คน" (person) or "รถ" (vehicle).
export const isVehicleViolation = (nameTh: string): boolean =>
  nameTh.trim().startsWith('รถ')

interface UseViolationRowsResult {
  pageRows: CrosswalkViolationRow[]
  totalPages: number
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

  return { pageRows, totalPages, page, setPage, isLoading, pageStart }
}
