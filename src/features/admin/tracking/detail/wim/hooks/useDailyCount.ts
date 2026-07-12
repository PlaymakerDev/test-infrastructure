import type { StationDailyCountData } from '@/types/tracking/detail-api'
import { useStationDailyCount } from './useStationDailyCount'
import { useWimDailyCount } from './useWimDailyCount'

type DailyCountResult =
  | { kind: 'STATION'; data: StationDailyCountData | undefined; isLoading: boolean; isError: boolean }
  | { kind: 'WIM'; data: StationDailyCountData | undefined; isLoading: boolean; isError: boolean }

/** Picks the station-daily-count or wim-daily-count read based on `stationType`,
 *  mirroring `useDailyTable`'s branching — only the endpoint differs, `station_status`
 *  is not a filter here since the count response already breaks down normal/abnormal/
 *  wim_disconnected/total together. */
export function useDailyCount(
  id: string | number | undefined,
  stationType: string | null | undefined,
  options?: { startDate?: string; endDate?: string }
): DailyCountResult {
  const params = {
    start_date: options?.startDate,
    end_date: options?.endDate,
    station_id: id,
  }

  const station = useStationDailyCount(params, stationType === 'STATION')
  const wim = useWimDailyCount(params, stationType === 'WIM')

  if (stationType === 'STATION') {
    return { kind: 'STATION', data: station.data?.data?.data, isLoading: station.isLoading, isError: station.isError }
  }
  return { kind: 'WIM', data: wim.data?.data?.data, isLoading: wim.isLoading, isError: wim.isError }
}
