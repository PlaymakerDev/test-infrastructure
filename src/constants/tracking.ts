// Named distinctly from vehicle.ts's `STATION_TYPE` (a different concept —
// vehicle inspection unit type strings) to avoid an ambiguous re-export
// collision through the `@/constants` barrel.
export const TRACKING_STATION_TYPE = {
  STATION: 1,
  WIM: 3,
} as const

export type StationTypeName = keyof typeof TRACKING_STATION_TYPE

/** Maps the `stationType` route param ("STATION" | "WIM") to the numeric station_type_id
 *  the backend expects. Returns `null` for anything else (missing/unrecognized). */
export const toStationTypeId = (name?: string | null): number | null => {
  if (name === 'STATION') return TRACKING_STATION_TYPE.STATION
  if (name === 'WIM') return TRACKING_STATION_TYPE.WIM
  return null
}

export const STATION_STATUS = {
  "เปิดปกติ": {
    "text": "เปิดปกติ",
    "color": "--default-blue"
  },
  "ไม่ส่งข้อมูล": {
    "text": "ไม่ส่งข้อมูล",
    "color": "--light-gray"
  },
  "ระบบขัดข้อง": {
    "text": "ระบบขัดข้อง",
    "color": "red-500"
  },
}

export const MOBILE_STATUS = {
  "0": {
    "text": "เปิดด่าน",
    "color": "--default-blue",
  },
  "1": {
    "text": "ปิดด่าน",
    "color": "--light-gray",
  },
}