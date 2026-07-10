import { useQuery } from '@tanstack/react-query'
import { getLightingTopPowerRoadsAPI } from '@/services/routes/LightingService'
import type { TopPowerRoadItem } from '@/types/lighting'
import { lightingKeys } from './queryKeys'

/** Roads ranked by total power draw (kW) descending, for the given
 *  department + date range — backs the "สายทางที่ใช้ไฟมากที่สุด" stat card. */
export const useTopPowerRoads = (deptId: number, startDate: string, endDate: string, limit?: number) =>
  useQuery({
    queryKey: lightingKeys.topPowerRoads.list(deptId, startDate, endDate, limit),
    queryFn: () =>
      getLightingTopPowerRoadsAPI(deptId, { start_date: startDate, end_date: endDate, limit })
        .then((r) => r.data ?? [] as TopPowerRoadItem[]),
  })
