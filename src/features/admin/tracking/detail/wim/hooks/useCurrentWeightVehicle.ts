import dayjs from 'dayjs'
import { useWeightWimLog } from './useWeightWimLog'
import { useWeightStationLog } from './useWeightStationLog'
import { useWeightWimLogByID } from './useWeightWimLogByID'
import { useWeightStationLogByID } from './useWeightStationLogByID'

/** Picks the wim or station "latest overweight log" read based on `stationType`,
 *  mirroring useStationDetail/useDailyWeightLog: fetch this month's overweight
 *  log list, take its first row's `td_id`, then fetch that row's full detail.
 *  The two by-id response shapes are close but not identical (WIM adds `speed`/
 *  `over10percent`; STATION adds axle_left/right_XX + `station`) — callers
 *  narrow with `'speed' in data` rather than forcing a normalized shape. */
export function useCurrentWeightVehicle(
  id: string | number | undefined,
  stationType: string | null | undefined,
  stationTypeId: number | null | undefined
) {
  // const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const today = dayjs().format('YYYY-MM-DD')

  const isStation = stationType === 'STATION'
  const isWim = stationType === 'WIM'

  const stationLog = useWeightStationLog(
    { start_date: today, end_date: today, is_over_weight: 'Y', station: id as number },
    isStation
  )
  const wimLog = useWeightWimLog(
    { start_date: today, end_date: today, is_over_weight: 'Y', station: id as number },
    isWim
  )

  const stationTdId = stationLog.data?.data?.data?.[0]?.td_id
  const wimTdId = wimLog.data?.data?.data?.[0]?.td_id

  const stationById = useWeightStationLogByID(stationTdId, isStation && !!stationTdId)
  const wimById = useWeightWimLogByID(wimTdId, stationTypeId, isWim && !!wimTdId)

  return isStation ? stationById : wimById
}
