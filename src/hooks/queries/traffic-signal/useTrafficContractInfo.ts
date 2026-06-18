import { useQuery } from '@tanstack/react-query'
import { getTrafficContractInfoAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Contract/project metadata for the detail page title bar.
 *  Returns project name, contract no, warranty dates, company. */
export const useTrafficContractInfo = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.contractInfo(id ?? ''),
    queryFn: () => getTrafficContractInfoAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
