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

// ANALYTIC PROVINCE TRAFFIC
export interface APIRequestAnalyticProvinceTraffic {
  days?: number
}

export interface APIResponseAnalyticProvinceTraffic extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: AnalyticProvinceTrafficData[]
}

export interface AnalyticProvinceTrafficData {
  province: string
  road_count: number
  total_vehicles: number
  avg_per_road_day: number
  peak_single_day: number
}

// PROVINCE SUMMARY
export type APIResponseProvinceSummary = ProvinceSummaryData[]

export interface ProvinceSummaryData {
  province_name: string
  road_count: number
  vehicles_now: number
  vehicles_today: number
  overweight: number
  avg_lat: string
  avg_lng: string
}

// TOP ACTIVE TRUCKS
export interface APIRequestTopActiveTruck {
  limit?: number
}

export interface APIResponseTopActiveTruck extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: TopActiveTruckData[]
}

export interface TopActiveTruckData {
  unit_id: string
  plate_no: string
  plate_province: string
  com_name: string
  speed: number
  is_on_assigned_road: boolean
  last_updated_at: string
  current_road_name: string
  road_count_today: number
  total_passes_today: number
}

// VEHICLE HISTORY
export interface APIRequestVehicleHistory {
  unit_id?: string
  date?: string
}

export interface APIResponseVehicleHistory extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: VehicleHistoryData
}

export interface VehicleHistoryData {
  vehicle: VehicleData
  route_events: RouteEventList[]
  track: number[][]
}

export interface VehicleData {
  unit_id: string
  plate_no: string
  plate_province: string
  com_name: string
  brn_desc: string
  type_desc: string
  kind_desc: string
  wgt: string
  speed: number
  is_on_assigned_road: boolean
  last_updated_at: string
  lat: number
  lon: number
  road_code: string
  road_name: string
}

export interface RouteEventList {
  id: number
  event_type: string
  event_time: string
  speed: number
  road_id: number
  road_code: string
  road_name: string
  center_lat: string
  center_lng: string
}

// VEHICLE ROUTE HISTORY
export interface APIRequestVehicleRouteHistory {
  unit_id?: string
  days?: string | number
}

export interface APIResponseVehicleRouteHistory extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: VehicleRouteHistoryData
}

export interface VehicleRouteHistoryData {
  vehicle: VehicleData
  today_track: number[][]
  events_by_date: EventsByDate
  road_geometries: RoadGeometry[]
}

export type EventsByDate = Record<string, RouteEventItem[]>

export interface RouteEventItem {
  date: string
  event_type: string
  event_time: string
  speed: number
  road_id: number
  road_code: string
  road_name: string
  center_lat: string
  center_lng: string
}

export interface RoadGeometry {
  road_id: number
  road_code: string
  road_name: string
  geojson: Geojson
}

export interface Geojson {
  type: string
  coordinates: number[][]
}

// ANALYTIC VEHICLE TYPE
export interface APIResponseAnalyticVehicleType extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: AnalyticVehicleTypeData[]
}

export interface AnalyticVehicleTypeData {
  type_desc: string
  count: number
}

// HOURLY TRAFFIC
export interface APIRequestHourlyTraffic {
  date?: string
}

export type APIResponseHourlyTraffic = HourlyTrafficData[]

export interface HourlyTrafficData {
  hour: number
  total: number
}

// ANALYTIC WEEKLY PATTERN
export interface APIRequestAnalyticWeeklyPattern {
  weeks?: string
}

export interface APIResponseAnalyticWeeklyPattern extends Omit<APIResponseAllVehicleLocation, 'data'> {
  data: AnalyticWeeklyPatternData[]
}

export interface AnalyticWeeklyPatternData {
  dow: number
  avg_vehicles: number
}