import { useQuery } from '@tanstack/react-query'
import { getVMSCommandCenterHistoryAPI } from '@/services/routes/ControlVMSService'
import type { APIRequestVMSGlobalHistory } from '@/types/vms/command-center-api'

export function useGlobalHistory(params: APIRequestVMSGlobalHistory, opts?: { enabled?: boolean; refetchIntervalMs?: number }) {
  return useQuery({
    queryKey: ['vms-command-center', 'global-history', params.from ?? '', params.to ?? '', params.limit ?? 100],
    queryFn: () => getVMSCommandCenterHistoryAPI(params),
    enabled: opts?.enabled ?? true,
    refetchInterval: opts?.refetchIntervalMs ?? 15_000,
    refetchIntervalInBackground: false,
    staleTime: 3_000,
  })
}
