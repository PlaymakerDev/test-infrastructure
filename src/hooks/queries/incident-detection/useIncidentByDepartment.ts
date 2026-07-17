import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getIncidentByDepartmentAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Per-department incident counts by type — powers the comparison table.
 *  `placeholderData: keepPreviousData` keeps the previous period's rows
 *  visible while the new period refetches, so the table never flashes empty
 *  when switching periods (same pattern as useIncidentTransactions). */
export const useIncidentByDepartment = (
  deptId: string | number,
  params: { start_date?: string; end_date?: string; scope?: string } = {},
) =>
  useQuery({
    queryKey: incidentKeys.byDepartment(deptId, params),
    queryFn: () => getIncidentByDepartmentAPI(deptId, { scope: 'all', ...params }).then((r) => r.data),
    enabled: deptId !== undefined && deptId !== null && String(deptId) !== '',
    placeholderData: keepPreviousData,
  })
