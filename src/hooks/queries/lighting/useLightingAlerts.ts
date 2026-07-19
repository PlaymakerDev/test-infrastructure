import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { getLightingAlertsAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** Paginated alert log for one device (ตารางข้อมูลรายเหตุการณ์).
 *  `keepPreviousData` keeps the current rows visible while the next page
 *  loads, so paging doesn't flash empty. */
export const useLightingAlerts = (
  imei: string,
  page: number,
  limit: number,
  sort: 'ASC' | 'DESC' = 'DESC',
) =>
  useQuery({
    queryKey: lightingKeys.alerts(imei, page, limit, sort),
    queryFn: () => getLightingAlertsAPI(imei, { page, limit, sort }).then((r) => r.data),
    enabled: !!imei,
    placeholderData: keepPreviousData,
  })

// Backend hard-enforces this as the max `limit` per request — confirmed
// live: limit=150+ on /lighting/imei/{imei}/alerts returns 400 res_code
// 40010 { keys: ['limit'], details: 'max' }. There is no way to request more
// rows in a single call than this.
const MAX_PAGE_LIMIT = 100

/** Every alert for a device, with no visible pagination and no row cap: pulls
 *  page 1 to learn `meta_data.total_pages`, then fetches every remaining
 *  page in parallel (still `limit=100` each, the backend's own ceiling) and
 *  concatenates them — so a device with more than 100 alerts still shows
 *  all of them instead of being silently truncated to the first page. */
export const useAllLightingAlerts = (imei: string, sort: 'ASC' | 'DESC' = 'DESC') => {
  const first = useQuery({
    queryKey: lightingKeys.alerts(imei, 1, MAX_PAGE_LIMIT, sort),
    queryFn: () => getLightingAlertsAPI(imei, { page: 1, limit: MAX_PAGE_LIMIT, sort }).then((r) => r.data),
    enabled: !!imei,
    placeholderData: keepPreviousData,
  })

  const totalPages = first.data?.meta_data?.total_pages ?? 1
  const extraPages = totalPages > 1 ? Array.from({ length: totalPages - 1 }, (_, i) => i + 2) : []

  const rest = useQueries({
    queries: extraPages.map((page) => ({
      queryKey: lightingKeys.alerts(imei, page, MAX_PAGE_LIMIT, sort),
      queryFn: () => getLightingAlertsAPI(imei, { page, limit: MAX_PAGE_LIMIT, sort }).then((r) => r.data),
      enabled: !!imei && first.isSuccess,
    })),
  })

  const alerts = [
    ...(first.data?.res_data ?? []),
    ...rest.flatMap((q) => q.data?.res_data ?? []),
  ]

  return {
    alerts,
    total: first.data?.meta_data?.count ?? 0,
    isLoading: first.isLoading || rest.some((q) => q.isLoading),
    isFetching: first.isFetching || rest.some((q) => q.isFetching),
  }
}
