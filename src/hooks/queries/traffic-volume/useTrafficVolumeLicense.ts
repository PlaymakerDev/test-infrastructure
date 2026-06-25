import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeLicenseAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Camera license keys for ONE counting solution. `solutionId` = the solution.id. */
export const useTrafficVolumeLicense = (solutionId: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficVolumeKeys.license(solutionId ?? ''),
    queryFn: () => getTrafficVolumeLicenseAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
