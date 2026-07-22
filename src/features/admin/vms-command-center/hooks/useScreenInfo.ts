import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getVMSScreenInfoAPI,
  putVMSScreenInfoAllowSettingsAPI,
  putVMSScreenInfoCentralizeAPI,
} from '@/services/routes/VMSService'
import type {
  APIRequestScreenInfoAllowSettings,
  APIRequestScreenInfoCentralize,
} from '@/types/vms/screen-info-api'
import { controlVmsKeys } from '@/features/admin/control-vms/overall/data/queryKeys'

// `screen-info` is inventory-scale (dozens–hundreds of rows) but the fields
// churn cheaply — a 30s poll matches how often the agent heartbeat table
// updates on the backend. Callers that want a slower cadence pass their own
// refetchIntervalMs (e.g. dispatch tab where we only need capability gating).
export const SCREEN_INFO_KEY = ['vms-screen-info'] as const

export function useScreenInfo(opts?: { refetchIntervalMs?: number | false }) {
  return useQuery({
    queryKey: SCREEN_INFO_KEY,
    queryFn: () => getVMSScreenInfoAPI(),
    refetchInterval: opts?.refetchIntervalMs === false ? false : (opts?.refetchIntervalMs ?? 30_000),
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  })
}

export function useCentralizeVMSScreenInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ wid, data }: { wid: number; data: APIRequestScreenInfoCentralize }) =>
      putVMSScreenInfoCentralizeAPI(wid, data),
    onSuccess: () => {
      // Full invalidation — summary counts + capability flags all move
      // together, so a targeted patch is more code than it's worth.
      qc.invalidateQueries({ queryKey: SCREEN_INFO_KEY })
    },
  })
}

// Toggles vms.tbl_vms_crossing.is_allowed_settings — the gate that controls
// whether a sign even APPEARS in the sidebar tree (departments API), so this
// invalidates BOTH screen-info (this tab) and departments (the sidebar) —
// unlike centralize, which only affects screen-info-derived state.
export function useAllowSettingsVMSScreenInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ wid, data }: { wid: number; data: APIRequestScreenInfoAllowSettings }) =>
      putVMSScreenInfoAllowSettingsAPI(wid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCREEN_INFO_KEY })
      qc.invalidateQueries({ queryKey: controlVmsKeys.departments() })
    },
  })
}
