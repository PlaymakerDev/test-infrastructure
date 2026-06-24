import { useQuery } from '@tanstack/react-query'
import { getCctvUptimeStatisticsAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVUptime } from '@/types/cctv/camera-api'
import { cctvKeys } from './queryKeys'

/** Uptime statistics with a maintenance flag. */
export const useCctvUptimeStatistics = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVUptime = {}
) =>
  useQuery({
    queryKey: cctvKeys.cameras.uptime(deptId ?? '', params),
    queryFn: () => getCctvUptimeStatisticsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
