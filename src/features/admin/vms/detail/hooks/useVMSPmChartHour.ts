import { useQuery } from '@tanstack/react-query'
import { postVMSPmChartHourAPI } from '@/services/routes/VMSService'
import { vmsDetailKeys } from '../data/queryKeys'

/** Hourly PM buckets for the นำออกเอกสาร modal — `/vms/pm-chart-hour` with an
 *  explicit CE `YYYY-MM-DD` range (inclusive). `enabled` gates on the modal
 *  being open so the range picker doesn't fire requests while the dialog is
 *  closed (same shape as useBridgeLightingPmChartHour). */
export const useVMSPmChartHour = (
  solutionId: number | undefined,
  startDate: string,
  endDate: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: vmsDetailKeys.pmChartHourDetail(String(solutionId ?? ''), startDate, endDate),
    queryFn: () =>
      postVMSPmChartHourAPI({ solution_id: solutionId!, start_date: startDate, end_date: endDate }),
    enabled: enabled && !!solutionId && startDate !== '' && endDate !== '',
  })
