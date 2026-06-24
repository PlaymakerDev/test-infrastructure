import { useQuery } from '@tanstack/react-query'
import { getIncidentDailyAPI } from '@/services/routes/AnalyticService'
import type { APIRequestIncidentDaily } from '@/types/incident-detection/details-api'
import { incidentKeys } from './queryKeys'

/** Daily event-type breakdown for one solution — feeds the trend line chart. */
export const useIncidentDaily = (params: Partial<APIRequestIncidentDaily>) =>
  useQuery({
    queryKey: incidentKeys.details.daily(params as APIRequestIncidentDaily),
    queryFn: () => getIncidentDailyAPI(params as APIRequestIncidentDaily).then((r) => r.data),
    enabled: !!params.solution_id,
  })
