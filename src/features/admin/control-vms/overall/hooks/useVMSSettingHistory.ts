import { useQuery } from '@tanstack/react-query'
import { getVMSSettingStatusHistoryAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSSettingHistory(settingID?: number, opts?: { enabled?: boolean; refetchIntervalMs?: number }) {
  const enabled = (opts?.enabled ?? true) && !!settingID
  return useQuery({
    queryKey: controlVmsKeys.historyBySetting(settingID),
    queryFn: () => getVMSSettingStatusHistoryAPI(settingID as number, { limit: 200 }),
    enabled,
    refetchInterval: opts?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  })
}
