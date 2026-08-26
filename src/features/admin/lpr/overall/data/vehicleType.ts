import type { LPRVehicleTypeSource } from '@/types/lpr/lpr-api'

/** The vehicle-type fields shared by the /plates list items and the plate
 *  detail's `metadata` — the two places that render a vehicle type. */
export interface VehicleTypeFields {
  vehicle_type_source?: LPRVehicleTypeSource | null
  vehicle_type_number?: number | string | null
  vehicle_type_name?: string | null
}

export interface VehicleTypeDisplay {
  /** Ready-to-render text — `'-'` when the plate has no type data. */
  label: string
  /** `true` when `label` is the long WIM description fallback (source='wim'
   *  but no type number) — callers should truncate and attach a `title`
   *  tooltip so the full text stays reachable. */
  isLongWimName: boolean
  /** The ANPR type name ("รถกระบะ", …) when that's what `label` shows —
   *  callers use it to look up `VEHICLE_TYPE_COLOR`. Absent for WIM labels. */
  anprName?: string
  /** WIM's full description (`vehicle_type_name`) when `label` is the short
   *  "ประเภท N" — the detail card renders it as a secondary line under the
   *  number (2026-08-24 request); the list badge ignores it. */
  wimName?: string
}

const cleanStr = (v: number | string | null | undefined): string =>
  v != null && String(v).trim() !== '' ? String(v).trim() : ''

/** The live API still ships `vehicle_type_number` WITH the "ประเภท " prefix
 *  ("ประเภท 11/1", verified 2026-08-24) while the contract doc specs a bare
 *  "11/1" — strip any leading prefix so we can re-add exactly one. */
const bareTypeNumber = (v: number | string | null | undefined): string =>
  cleanStr(v).replace(/^ประเภท\s*/, '')

/**
 * ONE formatter for the vehicle type on the LPR ค้นหาป้ายทะเบียนรายคัน page
 * (left list badge + detail's ประเภทยานพาหนะ card) — a plate's type can come
 * from two classification systems and `vehicle_type_source` says which one
 * applies (2026-08-24):
 *  - 'anpr' → the short ANPR name (`vehicle_type_name`, e.g. "รถกระบะ")
 *  - 'wim'  → "ประเภท {vehicle_type_number}" (e.g. "ประเภท 11/1"); when the
 *    number is missing, falls back to the long WIM description with
 *    `isLongWimName` set so callers truncate + tooltip it
 *  - null / absent (old payloads) → '-'
 * Previously the UI always showed `vehicle_type_name`, so a wim+anpr plate
 * whose ANPR side had no type overflowed its badge with the long WIM text.
 */
export const formatVehicleType = (item: VehicleTypeFields | null | undefined): VehicleTypeDisplay => {
  const source = item?.vehicle_type_source
  const name = cleanStr(item?.vehicle_type_name)

  if (source === 'anpr') {
    return name ? { label: name, isLongWimName: false, anprName: name } : { label: '-', isLongWimName: false }
  }
  if (source === 'wim') {
    const number = bareTypeNumber(item?.vehicle_type_number)
    if (number) {
      return { label: `ประเภท ${number}`, isLongWimName: false, wimName: name || undefined }
    }
    return name ? { label: name, isLongWimName: true } : { label: '-', isLongWimName: false }
  }
  return { label: '-', isLongWimName: false }
}
