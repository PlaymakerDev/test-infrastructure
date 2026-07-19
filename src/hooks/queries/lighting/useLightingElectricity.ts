import { useQuery } from '@tanstack/react-query'
import { getLightingElectricityAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** Aggregated electricity per period bucket for the รายงานสรุปการทำงาน tab. */
export const useLightingElectricity = (
  imei: string,
  opts: {
    start_date?: string
    end_date?: string
    report_type: 'hourly' | 'daily' | 'monthly' | 'yearly'
  },
) =>
  useQuery({
    queryKey: lightingKeys.electricity(imei, opts.start_date, opts.end_date, opts.report_type),
    queryFn: () =>
      getLightingElectricityAPI(imei, { ...opts, sort: 'ASC' }).then((r) => r.data),
    enabled: !!imei,
    // Keep prior filter results only for the same device. Reusing them after
    // an IMEI change would briefly present another controller's telemetry.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === imei ? previousData : undefined,
  })
