import { useQuery } from '@tanstack/react-query'
import { postVMSPmChartAPI } from '@/services/routes/VMSService'
import { vmsDetailKeys } from '../data/queryKeys'

/** Last ~24 h of 5-MINUTE power-meter buckets for a VMS solution. Currently
 *  UNUSED: the detail charts switched to hourly `/vms/pm-chart-hour` with a
 *  24 ชม./7 วัน/30 วัน selector (2026-09-02 — 5-min was judged too fine) but
 *  this hook is deliberately kept as the ready-made detailed mode if users
 *  ask for it back. Returns an empty array for signs without a meter
 *  (most of them — 12/275 had data on 2026-09-02). */
export const useVMSPmChart = (solutionId: number | undefined) =>
  useQuery({
    queryKey: vmsDetailKeys.pmChartDetail(String(solutionId ?? '')),
    queryFn: () => postVMSPmChartAPI({ solution_id: solutionId! }),
    enabled: !!solutionId,
  })
