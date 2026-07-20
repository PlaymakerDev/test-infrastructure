import { useQuery } from '@tanstack/react-query'
import { getVMSDetailsAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

/** Full solution detail (crossings/desktop_screen/vms_camera/weather).
 *  Consumed by statistics/detail/status's traffic-camera panel. */
export function useVMSDetails(solutionId?: number | string) {
  return useQuery({
    queryKey: controlVmsKeys.vmsDetails(solutionId),
    queryFn: () => getVMSDetailsAPI(solutionId!),
    enabled: !!solutionId,
  })
}
