import { useQuery } from '@tanstack/react-query'
import {
  LIGHTING_MAX_LIMIT,
  fetchAllLightingPages,
  getLightingElectricityAPI,
} from '@/services/routes/LightingService'
import {
  electricityRequestStart,
  trimElectricityToRange,
  type ElectricityReportType,
} from './electricityRange'
import { lightingKeys } from './queryKeys'

/** Aggregated electricity per period bucket for the รายงานสรุปการทำงาน tab —
 *  every period of the range, not just the first page of 100, and exactly the
 *  Thai-time days picked (see electricityRange for the backend's UTC days). */
export const useLightingElectricity = (
  imei: string,
  opts: {
    start_date?: string
    end_date?: string
    report_type: ElectricityReportType
    /** Off = don't fetch (the caller only needs it for some report types). */
    enabled?: boolean
  },
) =>
  useQuery({
    queryKey: lightingKeys.electricity(imei, opts.start_date, opts.end_date, opts.report_type),
    queryFn: async () => {
      const { start_date, end_date, report_type } = opts
      const all = await fetchAllLightingPages((page) =>
        getLightingElectricityAPI(imei, {
          start_date: start_date ? electricityRequestStart(start_date) : undefined,
          end_date,
          report_type,
          sort: 'ASC',
          page,
          limit: LIGHTING_MAX_LIMIT,
        }).then((r) => r.data),
      )
      if (!start_date || !end_date) return all
      const rows = trimElectricityToRange(all.res_data, report_type, start_date, end_date)
      return { res_data: rows, meta_data: { ...all.meta_data, count: rows.length } }
    },
    enabled: !!imei && (opts.enabled ?? true),
    // Keep prior filter results only for the same device. Reusing them after
    // an IMEI change would briefly present another controller's telemetry.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === imei ? previousData : undefined,
  })
