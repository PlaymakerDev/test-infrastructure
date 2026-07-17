import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useWeightWimLog } from './useWeightWimLog'
import { useWeightStationLog } from './useWeightStationLog'

export interface DailyWeightLogRow {
  key: string
  time_stamp: string
  lp_head_no: string
  lp_head_province_name: string
  vehicle_class_id: number
  vehicle_class_desc: string
  gross_weight: string
  legal_weight: string
  gross_weight_over: string
  is_over_weight: string
  is_over_weight_desc: string
  // Neither weight_wim_log nor weight_station_log's LIST response has a `speed`
  // field at all (only the by-id endpoint does, e.g. CardCurrentWeightVehicle) —
  // always undefined here, not faked.
  speed?: string
  // STATION's list response has no image fields at all — undefined for STATION
  // rows, not faked.
  plate_image?: string
  vehicle_image?: string
}

const getGrossWeightOver = (item: { gross_weight_over: string } | { grossweight_over: string }) =>
  'gross_weight_over' in item ? item.gross_weight_over : item.grossweight_over

/** Picks the wim or station weight-log list based on `stationType` (server-side
 *  paginated via `page`/`pageSize`) and normalizes both shapes into one row model
 *  for TableOverallDailyWeight/TableWeightLog — mirrors useDailyWeightLog's
 *  normalization, plus the image fields that only WIM's list response actually
 *  has (STATION's list response has neither images nor `speed`; `speed` is
 *  absent from both). `date` (single day, defaults to today) is used as both
 *  start_date and end_date — this is always a single-day log view. */
export function useDailyWeightLogList(
  id: string | number | undefined,
  stationType: string | null | undefined,
  page: number,
  pageSize: number,
  isOverWeight?: 'Y' | 'N',
  date?: string
) {
  const day = date ?? dayjs().format('YYYY-MM-DD')
  const isStation = stationType === 'STATION'
  const isWim = stationType === 'WIM'

  const params = {
    start_date: day,
    end_date: day,
    station: id as number,
    page,
    page_size: pageSize,
    is_over_weight: isOverWeight,
  }

  const station = useWeightStationLog(params, isStation)
  const wim = useWeightWimLog(params, isWim)

  const payload = isStation ? station.data?.data : wim.data?.data
  const isLoading = isStation ? station.isLoading : wim.isLoading
  const isError = isStation ? station.isError : wim.isError

  const data = useMemo<DailyWeightLogRow[]>(() => {
    if (!payload) return []
    return payload.data.map((item) => ({
      key: item.td_id,
      time_stamp: item.time_stamp,
      lp_head_no: item.lp_head_no,
      lp_head_province_name: item.lp_head_province_name,
      vehicle_class_id: item.vehicle_class_id,
      vehicle_class_desc: item.vehicle_class_desc,
      gross_weight: item.gross_weight,
      legal_weight: item.legal_weight,
      gross_weight_over: getGrossWeightOver(item),
      is_over_weight: item.is_over_weight,
      is_over_weight_desc: item.is_over_weight_desc,
      speed: undefined,
      plate_image: 'image_01_name' in item ? item.image_01_name : undefined,
      vehicle_image: 'image_02_name' in item ? item.image_02_name : undefined,
    }))
  }, [payload])

  return { data, meta: payload?.meta, isLoading, isError }
}
