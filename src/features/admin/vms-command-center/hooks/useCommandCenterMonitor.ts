import { useQuery } from '@tanstack/react-query'
import { getVMSCommandCenterMonitorAPI } from '@/services/routes/ControlVMSService'

export function useCommandCenterMonitor(vmsIds: number[], opts?: { refetchIntervalMs?: number }) {
  const enabled = vmsIds.length > 0
  return useQuery({
    queryKey: ['vms-command-center', 'monitor', [...vmsIds].sort((a, b) => a - b)],
    queryFn: () => getVMSCommandCenterMonitorAPI(vmsIds),
    enabled,
    refetchInterval: enabled ? (opts?.refetchIntervalMs ?? 5_000) : false,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  })
}
