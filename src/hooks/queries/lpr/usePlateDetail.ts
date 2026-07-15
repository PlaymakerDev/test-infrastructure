import { useQuery } from '@tanstack/react-query'
import { getLPRPlateDetailAPI } from '@/services/routes/LPRService'
import { lprKeys } from './queryKeys'

/** Single-plate detail — drives the timeline header/metadata card, map, and
 *  frequent-areas panel. Enabled only once a plate is selected. */
export const usePlateDetail = (
  province: string | null | undefined,
  plateNumber: string | null | undefined
) =>
  useQuery({
    queryKey: lprKeys.plate.detail(province ?? '', plateNumber ?? ''),
    queryFn: () => getLPRPlateDetailAPI(province!, plateNumber!).then((r) => r.data),
    enabled: !!province && !!plateNumber,
  })
