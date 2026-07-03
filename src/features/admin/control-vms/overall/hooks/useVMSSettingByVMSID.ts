import { useQuery } from '@tanstack/react-query'
import { getVMSSettingByVMSIDAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingByVMSID(vmsIds: number[], enabled: boolean) {
  return useQuery({
    queryKey: controlVmsKeys.byVmsIds(vmsIds),
    queryFn: () => getVMSSettingByVMSIDAPI({ vms_ids: vmsIds }),
    enabled: enabled && vmsIds.length > 0,
  })
}
