import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { WeightWIMLogMeta } from '@/types/tracking/detail-api'
import { useWeightWimLog } from './useWeightWimLog'
import { useWeightStationLog } from './useWeightStationLog'

/** Common shape both the WIM and STATION daily-log rows are normalized into.
 *  The two backend endpoints disagree on this field's name for the same
 *  concept (`gross_weight_over` vs `grossweight_over`, no underscore) —
 *  normalizing here means consumers never need to shape-sniff. */
export interface NormalizedDailyLogItem {
  gross_weight: string
  gross_weight_over: string
  legal_weight: string
}

export interface NormalizedDailyLog {
  meta: WeightWIMLogMeta
  data: NormalizedDailyLogItem[]
}

const getGrossWeightOver = (item: { gross_weight_over: string } | { grossweight_over: string }) =>
  'gross_weight_over' in item ? item.gross_weight_over : item.grossweight_over

/** Picks today's weight-wim-log or weight-station-log read based on
 *  `stationType`, and normalizes the result into one common shape. Replaces
 *  the WIM/STATION union-prop shape-sniffing previously pushed onto
 *  CardDailyWeight/CardDailyOverweight/OverallStatCard/OverallWeightStat. */
export function useDailyWeightLog(
  id: string | number | undefined,
  stationType: string | null | undefined
) {
  const today = dayjs().format('YYYY-MM-DD')
  const wimParams = { start_date: today, end_date: today, station: id as number }
  const stationParams = { start_date: today, end_date: today, station: id as number }

  const wim = useWeightWimLog(wimParams, stationType === 'WIM')
  const station = useWeightStationLog(stationParams, stationType === 'STATION')

  const isStation = stationType === 'STATION'
  const raw = isStation ? station.data?.data : wim.data?.data
  const isLoading = isStation ? station.isLoading : wim.isLoading
  const isError = isStation ? station.isError : wim.isError

  const data = useMemo<NormalizedDailyLog | undefined>(() => {
    if (!raw) return undefined
    return {
      meta: raw.meta,
      data: raw.data.map((item) => ({
        gross_weight: item.gross_weight,
        gross_weight_over: getGrossWeightOver(item),
        legal_weight: item.legal_weight,
      })),
    }
  }, [raw])

  return { data, isLoading, isError }
}
