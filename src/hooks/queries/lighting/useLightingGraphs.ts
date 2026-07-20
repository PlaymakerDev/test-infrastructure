import { useQuery } from '@tanstack/react-query'
import { getLightingVoltGraphAPI, getLightingAmpGraphAPI } from '@/services/routes/LightingService'
import { lightingKeys } from './queryKeys'

/** 24h hourly voltage points for the OVERVIEW tab's Volt chart.
 *  `enabled` should stay false until the device's phase has resolved (or
 *  confirmed absent) — otherwise this fires once with no `phase_type` and
 *  again once phase resolves, sending a wasted/incorrect first request. */
export const useLightingVoltGraph = (imei: string, phase?: number | null, enabled = true) =>
  useQuery({
    queryKey: lightingKeys.voltGraph(imei, phase),
    queryFn: () => getLightingVoltGraphAPI(imei, phase).then((r) => r.data ?? []),
    enabled: !!imei && enabled,
  })

/** 24h hourly current points for the OVERVIEW tab's Amp chart.
 *  Same `enabled` gating rationale as {@link useLightingVoltGraph}. */
export const useLightingAmpGraph = (imei: string, phase?: number | null, enabled = true) =>
  useQuery({
    queryKey: lightingKeys.ampGraph(imei, phase),
    queryFn: () => getLightingAmpGraphAPI(imei, phase).then((r) => r.data ?? []),
    enabled: !!imei && enabled,
  })
