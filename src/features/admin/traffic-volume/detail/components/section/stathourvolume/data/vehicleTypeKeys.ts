import type { CountingHourBucket } from '@/types/traffic-volume/detail-api'
import { VEHICLE_TYPES } from '../../overall/data/vehicleTypes'

/** Map internal vehicle-type key → API per-hour field key.
 *  The backend uses `bike_*` for motorcycle; everything else is 1:1. */
export const COUNT_FIELD_BY_TYPE: Record<
  string,
  keyof Pick<
    CountingHourBucket,
    | 'bike_count'
    | 'car_count'
    | 'truck_count'
    | 'bus_count'
    | 'taxi_count'
    | 'pickup_count'
    | 'trailer_count'
  >
> = {
  motorcycle: 'bike_count',
  car: 'car_count',
  pickup: 'pickup_count',
  taxi: 'taxi_count',
  bus: 'bus_count',
  truck: 'truck_count',
  trailer: 'trailer_count',
}

/** Re-export so callers don't need two imports for the per-row colors. */
export { VEHICLE_TYPES }
