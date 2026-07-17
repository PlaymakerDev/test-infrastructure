import { keepPreviousData, useQuery } from '@tanstack/react-query'
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
