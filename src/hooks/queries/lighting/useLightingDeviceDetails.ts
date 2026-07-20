import { useQuery } from '@tanstack/react-query'
import { getLightingDeviceDetailsAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** Device detail (phase, electricity[], line_checks, is_online,
 *  has_broken_wire) for the detail page's DetailContext. */
export const useLightingDeviceDetails = (imei: string) =>
  useQuery({
    queryKey: lightingKeys.deviceDetails(imei),
    queryFn: () => getLightingDeviceDetailsAPI(imei).then((r) => r.data),
    enabled: !!imei,
  })
