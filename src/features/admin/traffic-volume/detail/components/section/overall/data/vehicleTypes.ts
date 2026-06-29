// Vehicle-type config shared by the proportion pie chart and the
// per-type breakdown table on the ภาพรวม tab. Colors mirror the design,
// PCU factors follow the standard Thai DOH values.

export interface VehicleTypeConfig {
  key: string
  label: string
  color: string
  pcuFactor: number
}

// Color palette is a blue → orange gradient walking light to heavy
// (motorcycle = blue, trailer = orange). Shared across pie / stacked bar /
// table dots / line chart tooltips so all visualisations stay in sync.
export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  { key: 'motorcycle', label: 'รถจักรยานยนต์', color: '#007BFF', pcuFactor: 0.25 },
  { key: 'car',        label: 'รถยนต์',        color: '#00DDFF', pcuFactor: 1 },
  { key: 'pickup',     label: 'รถกระบะ',       color: '#00FFAA', pcuFactor: 1 },
  { key: 'taxi',       label: 'รถแท็กซี่',     color: '#00FF00', pcuFactor: 1 },
  { key: 'bus',        label: 'รถบัส',         color: '#C8FF00', pcuFactor: 2 },
  { key: 'truck',      label: 'รถบรรทุก',      color: '#FFC800', pcuFactor: 2.5 },
  { key: 'trailer',    label: 'รถพ่วง',        color: '#FF5E00', pcuFactor: 2.5 },
]
