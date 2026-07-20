import { useQuery } from '@tanstack/react-query'
import { getVMSNotificationsAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

/** Per-VMS notification history for a date range (both dates required by the
 *  endpoint — the query stays disabled until the range is picked).
 *  Consumed by statistics/detail/status's event table. */
export function useVMSNotifications(
  vmsId?: number | string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: controlVmsKeys.notifications(vmsId, startDate, endDate),
    queryFn: () => getVMSNotificationsAPI(vmsId!, { start_date: startDate!, end_date: endDate! }),
    enabled: !!vmsId && !!startDate && !!endDate,
  })
}
