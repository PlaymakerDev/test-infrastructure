import { useQuery } from '@tanstack/react-query'
import { postBridgeLightingPmChartHourAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

/** Hourly PM buckets for the นำออกเอกสาร modal — `/pm-chart-hour` with an
 *  explicit CE `YYYY-MM-DD` range (inclusive; 00:00–23:00 rows per day).
 *  `enabled` gates on the modal being open so the range picker doesn't fire
 *  requests while the dialog is closed. */
export const useBridgeLightingPmChartHour = (
  wid: number | undefined,
  startDate: string,
  endDate: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: bridgeLightingDetailKeys.pmChartHourDetail(String(wid ?? ''), startDate, endDate),
    queryFn: () =>
      postBridgeLightingPmChartHourAPI({ wid: String(wid), start_date: startDate, end_date: endDate }),
    enabled: enabled && wid != null && startDate !== '' && endDate !== '',
  })
