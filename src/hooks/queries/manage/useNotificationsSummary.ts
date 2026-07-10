import { useQuery } from '@tanstack/react-query'
import { getNotificationsSummaryAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/notifications/summary — one row per source_type
 *  (lighting/analytic/vms_setting), bare array. Powers the small detail
 *  cards on the Statistics overview page (most-common type + department). */
export const useNotificationsSummary = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: manageKeys.notifications.summary(startDate, endDate),
    queryFn: () => getNotificationsSummaryAPI(startDate, endDate).then((r) => r.data ?? []),
  })
