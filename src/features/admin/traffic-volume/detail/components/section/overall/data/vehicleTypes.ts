// Vehicle-type config shared by the proportion pie chart and the
// per-type breakdown table on the ภาพรวม tab. Colors mirror the design,
// PCU factors follow the standard Thai DOH values.

export interface VehicleTypeConfig {
  key: string
  label: string
  color: string
  pcuFactor: number
}

export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  { key: 'motorcycle', label: 'รถจักรยานยนต์', color: '#3B82F6', pcuFactor: 0.25 },
  { key: 'car',        label: 'รถยนต์',        color: '#22D3EE', pcuFactor: 1 },
  { key: 'pickup',     label: 'รถกระบะ',       color: '#10B981', pcuFactor: 1 },
  { key: 'taxi',       label: 'รถแท็กซี่',     color: '#84CC16', pcuFactor: 1 },
  { key: 'bus',        label: 'รถบัส',         color: '#FCD116', pcuFactor: 2 },
  { key: 'truck',      label: 'รถบรรทุก',      color: '#F59E0B', pcuFactor: 2.5 },
  { key: 'trailer',    label: 'รถพ่วง',        color: '#EF4444', pcuFactor: 2.5 },
]

/** Mock per-type counts matching the design screenshot. Swap with API once
 *  a `/counting/details/{id}/vehicle-types` endpoint exists. */
export const MOCK_VEHICLE_COUNTS: Record<string, number> = {
  motorcycle: 107,
  car: 1901,
  pickup: 947,
  taxi: 0,
  bus: 10,
  truck: 2578,
  trailer: 209,
}
