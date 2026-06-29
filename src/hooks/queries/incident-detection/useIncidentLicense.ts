import { useQuery } from '@tanstack/react-query'
import { getIncidentLicenseAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Camera license keys for ONE solution. `solutionId` = the solution.id. */
export const useIncidentLicense = (solutionId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.license(solutionId ?? ''),
    queryFn: () => getIncidentLicenseAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
