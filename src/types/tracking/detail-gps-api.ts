// FLEET KPI
export interface APIResponseFleetKPI {
  total_vehicles: number
  on_drr_road: number
  moving: number
  stopped: number
  overweight_history: number
  fresh: number
}

// ALL VEHICLE LOCATION
export interface APIRequestAllVehicleLocation {
  search?: string
}

export interface APIResponseAllVehicleLocation {
  success: boolean
  data: AllVehicleLocationData
}

export interface AllVehicleLocationData {
  list: VehicleList[]
  total: VehicleTotal
}

export interface VehicleList {
  road_id: number
  road_code: string
  unique_vehicles: number
  latitude: number
  longitude: number
  normal: string
  stop: string
  over_weight: string
}

export interface VehicleTotal {
  normal: number
  stop: number
  over_weight: number
  unique_vehicles: number
}