import { useStationById } from './useStationById'
import { useWimById } from './useWimById'

/** Picks the station-by-id or wim-by-id read based on `stationType`, since
 *  `detail/wim` backs both the WIM and STATION detail routes. Both response
 *  data shapes share `station_name`, which is all callers (e.g. TitleSection)
 *  need — no further normalization required. */
export function useStationDetail(
  id: string | number | undefined,
  stationType: string | null | undefined
) {
  const wim = useWimById(id, stationType === 'WIM')
  const station = useStationById(id, stationType === 'STATION')

  return stationType === 'STATION' ? station : wim
}
