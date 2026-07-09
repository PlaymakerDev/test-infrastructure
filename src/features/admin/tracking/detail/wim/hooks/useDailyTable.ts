import dayjs from 'dayjs'
import type { APIResponseStationDaily, APIResponseWIMDaily } from '@/types/tracking/detail-api'
import { useStationDaily } from './useStationDaily'
import { useWimDaily } from './useWimDaily'

type DailyTableResult =
  | { kind: 'STATION'; data: APIResponseStationDaily | undefined; isLoading: boolean; isError: boolean }
  | { kind: 'WIM'; data: APIResponseWIMDaily | undefined; isLoading: boolean; isError: boolean }

/** Picks the station-daily or wim-daily read based on `stationType`. The two
 *  rows shapes are close but not identical (WIM carries extra esal fields),
 *  so — unlike `useDailyWeightLog` — this stays a discriminated union rather
 *  than a normalized shape: callers branch on `kind` to pick which
 *  presentational table (`TableLatestStation`/`TableLatestWIM`) to render. */
export function useDailyTable(
  id: string | number | undefined,
  stationType: string | null | undefined
): DailyTableResult {
  const params = {
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
    station_id: id as string,
  }

  const station = useStationDaily(params, stationType === 'STATION')
  const wim = useWimDaily(params, stationType === 'WIM')

  if (stationType === 'STATION') {
    return { kind: 'STATION', data: station.data?.data, isLoading: station.isLoading, isError: station.isError }
  }
  return { kind: 'WIM', data: wim.data?.data, isLoading: wim.isLoading, isError: wim.isError }
}
