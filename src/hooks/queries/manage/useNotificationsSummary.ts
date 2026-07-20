import { useQuery } from '@tanstack/react-query'
import { getNotificationsSummaryAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/notifications/summary — one row per source_type
 *  (lighting/analytic/vms_setting), bare array. Powers the small detail
 *  cards on the Statistics overview page (most-common type + department).
 *  `staleTime: 0` — driven by the period selector (TODAY/LAST_7_DAYS/...),
 *  so switching periods (or re-selecting one) must always hit the API
 *  instead of serving a cached count for up to the global 60s staleTime. */
export const useNotificationsSummary = (startDate: string, endDate: string) =>
  useQuery({
    // Key factory takes ONE params object (mirrors the service's query params).
    queryKey: manageKeys.notifications.summary({ start_date: startDate, end_date: endDate }),
    queryFn: () => getNotificationsSummaryAPI(startDate, endDate).then((r) => r.data ?? []),
    staleTime: 0,
  })
