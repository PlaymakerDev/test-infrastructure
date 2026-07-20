import { useQuery } from '@tanstack/react-query'
import { getNotificationSummaryAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/notifications/summary — one row per source_type over the
 *  requested window. Backend scopes rows to the caller's dept via the JWT
 *  claim, so callers don't pass dept_id here.
 *
 *  Refreshes on a 60s interval so the dashboard's "แจ้งเตือนด่วน" pill
 *  stays warm without hammering the endpoint. */
export const useNotificationSummary = (params: {
  start_date: string
  end_date: string
}) =>
  useQuery({
    queryKey: manageKeys.notifications.summary(params),
    queryFn: () => getNotificationSummaryAPI(params).then((r) => r.data),
    refetchInterval: 60_000,
    enabled: !!params.start_date && !!params.end_date,
  })
