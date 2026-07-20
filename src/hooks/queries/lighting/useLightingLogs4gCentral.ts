import { useQuery } from '@tanstack/react-query'
import { getLightingLogs4gCentralAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

export interface LightingLogs4gCentralOptions {
  start_date?: string
  end_date?: string
  data_type?: 'circuit' | 'line_check' | 'volt_amp' | 'etc'
  page: number
  limit: number
}

/** Paginated controller log used by the MONITOR tab. Filters and pagination
 * are part of the cache key so identical views share data without stale rows. */
export const useLightingLogs4gCentral = (
  imei: string,
  options: LightingLogs4gCentralOptions,
) =>
  useQuery({
    queryKey: lightingKeys.logs4gCentral(
      imei,
      options.start_date,
      options.end_date,
      options.data_type,
      options.page,
      options.limit,
    ),
    queryFn: () => getLightingLogs4gCentralAPI(imei, options).then((response) => response.data),
    enabled: !!imei,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === imei ? previousData : undefined,
  })
