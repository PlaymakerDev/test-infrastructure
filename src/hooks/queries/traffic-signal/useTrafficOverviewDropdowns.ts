import { useQuery } from '@tanstack/react-query'
import { getTrafficOverviewDropdownsAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficOverviewDropdowns } from '@/types/traffic-signal/overview-api'
import { trafficSignalKeys } from './queryKeys'

/** Filter dropdown values (road_code, contract_no) for the overview list. */
export const useTrafficOverviewDropdowns = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficOverviewDropdowns = {}
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.dropdowns(deptId ?? '', params),
    queryFn: () =>
      getTrafficOverviewDropdownsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
