import { useQuery } from '@tanstack/react-query'
import { getVMSCommandCenterSignAPI } from '@/services/routes/ControlVMSService'

export function useSignDetail(vmsId: number | null, opts?: { refetchIntervalMs?: number }) {
  const enabled = vmsId != null && vmsId > 0
  return useQuery({
    queryKey: ['vms-command-center', 'sign-detail', vmsId ?? 0],
    queryFn: () => getVMSCommandCenterSignAPI(vmsId as number),
    enabled,
    refetchInterval: enabled ? (opts?.refetchIntervalMs ?? 5_000) : false,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  })
}
