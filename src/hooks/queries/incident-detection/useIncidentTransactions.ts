import { useQuery } from '@tanstack/react-query'
import { getIncidentTransactionsAPI } from '@/services/routes/AnalyticService'
import type { APIRequestIncidentTransactions } from '@/types/incident-detection/details-api'
import { incidentKeys } from './queryKeys'

/** Event transactions + summary by type. Powers the event table, donut chart,
 *  and latest-events list. Data from the previous query key must not be used as
 *  a placeholder: the key contains `solution_id`, so doing so can briefly show
 *  another device's events while navigation or filters are changing. */
export const useIncidentTransactions = (params: Partial<APIRequestIncidentTransactions>) =>
  useQuery({
    queryKey: incidentKeys.details.transactions(params as APIRequestIncidentTransactions),
    queryFn: () => getIncidentTransactionsAPI(params as APIRequestIncidentTransactions).then((r) => r.data),
    enabled: !!params.solution_id,
  })
