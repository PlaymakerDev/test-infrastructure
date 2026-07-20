import { useQuery } from '@tanstack/react-query'
import { getVMSStatusAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

/** Composite health snapshot for one VMS (operation/stream/box/last_setting).
 *  Consumed by statistics/detail/status's stat cards. */
export function useVMSStatus(vmsId?: number | string) {
  return useQuery({
    queryKey: controlVmsKeys.vmsStatus(vmsId),
    queryFn: () => getVMSStatusAPI(vmsId!),
    enabled: !!vmsId,
  })
}
