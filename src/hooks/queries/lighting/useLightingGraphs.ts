import { useQuery } from '@tanstack/react-query'
import { getLightingVoltGraphAPI, getLightingAmpGraphAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** 24h hourly voltage points for the OVERVIEW tab's Volt chart. */
export const useLightingVoltGraph = (imei: string) =>
  useQuery({
    queryKey: lightingKeys.voltGraph(imei),
    queryFn: () => getLightingVoltGraphAPI(imei).then((r) => r.data ?? []),
    enabled: !!imei,
  })

/** 24h hourly current points for the OVERVIEW tab's Amp chart. */
export const useLightingAmpGraph = (imei: string) =>
  useQuery({
    queryKey: lightingKeys.ampGraph(imei),
    queryFn: () => getLightingAmpGraphAPI(imei).then((r) => r.data ?? []),
    enabled: !!imei,
  })
