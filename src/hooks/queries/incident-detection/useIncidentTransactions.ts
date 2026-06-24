import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getIncidentTransactionsAPI } from '@/services/routes/AnalyticService'
import type { APIRequestIncidentTransactions } from '@/types/incident-detection/details-api'
import { incidentKeys } from './queryKeys'

/** Event transactions + summary by type. Powers the event table, donut chart,
 *  and latest-events list. `keepPreviousData` keeps the current rows visible
 *  while the next page / filter loads, so Tab2 pagination doesn't flash empty. */
export const useIncidentTransactions = (params: Partial<APIRequestIncidentTransactions>) =>
  useQuery({
    queryKey: incidentKeys.details.transactions(params as APIRequestIncidentTransactions),
    queryFn: () => getIncidentTransactionsAPI(params as APIRequestIncidentTransactions).then((r) => r.data),
    enabled: !!params.solution_id,
    placeholderData: keepPreviousData,
  })
