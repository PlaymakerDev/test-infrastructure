import { APIResponseTrackingPosition } from '@/types/tracking/overall-api'
import { TrackingStation } from './trackingStations'

function validateCoord(lat: string, lon: string): [number, number] | null {
  const la = parseFloat(lat)
  const lo = parseFloat(lon)
  if (isNaN(la) || isNaN(lo) || la === 0 || lo === 0) return null
  return [lo, la] // [lng, lat] — Mapbox expects longitude first
}

/** Convert position API response (station / wim / mobile arrays) to TrackingStation[]. */
export function positionToTrackingStations(position: APIResponseTrackingPosition): TrackingStation[] {
  return [
    ...(position.station ?? []).flatMap((item) => {
      const coord = validateCoord(item.Latitude, item.Longtitude)
      if (!coord) return []
      return [{
        id: `station-${item.StationID}`,
        code: String(item.StationID),
        name: item.StationName,
        type: 'station' as const,
        coord,
        status: item.isEnable ? 'open' as const : 'closed' as const,
        lastOpenDate: '-',
        totalVehicles: item.Total ?? 0,
        overweightVehicles: item.Over ?? 0,
      }]
    }),
    ...(position.wim ?? []).flatMap((item) => {
      const coord = validateCoord(item.Latitude, item.Longtitude)
      if (!coord) return []
      return [{
        id: `wim-${item.StationID}`,
        code: String(item.StationID),
        name: item.StationName,
        type: 'wim' as const,
        coord,
        status: item.isEnable ? 'open' as const : 'closed' as const,
        lastOpenDate: '-',
        totalVehicles: item.Total ?? 0,
        overweightVehicles: item.Over ?? 0,
      }]
    }),
    ...(position.mobile ?? []).flatMap((item) => {
      const coord = validateCoord(item.Latitude, item.Longtitude)
      if (!coord) return []
      const officerName = [item.first_name, item.last_name].filter(Boolean).join(' ') || undefined
      return [{
        id: `mobile-${item.TID}`,
        code: item.WayID,
        name: officerName || item.WayID,
        type: 'mobile' as const,
        coord,
        status: 'open' as const,
        lastOpenDate: '-',
        totalVehicles: 0,
        overweightVehicles: 0,
        officerName,
      }]
    }),
  ]
}
