import { useQuery } from '@tanstack/react-query'
import {
  getLightingLampCurrentHourlyAPI,
  getLightingLampSummaryAPI,
  getLightingLampsAPI,
  getLightingLampsCurrentHourlyAPI,
  getLightingLampsWeeklyAPI,
} from '@/services/routes/LightingService'
import type {
  LightingLampCurrentHourly,
  LightingLampList,
  LightingLampSummary,
  LightingLampWeekly,
} from '@/types/lighting'
import { lightingKeys } from './queryKeys'
import { unwrapLightingResponse } from './unwrapLightingResponse'

const isSolutionId = (solutionId: number | null | undefined): solutionId is number =>
  solutionId != null && solutionId > 0

/** A lamp point's lamps (`/lighting/solutions/{id}/lamps`) — status,
 *  connection, current and last report per lamp. Idle until the solution id
 *  is known. */
export const useLightingLamps = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.lamps(solutionId ?? 0),
    queryFn: () =>
      getLightingLampsAPI(solutionId!).then((r) => unwrapLightingResponse<LightingLampList>(r.data)),
    enabled: isSolutionId(solutionId),
  })

/** `/lighting/solutions/{id}/lamps/summary` — the lamp page reads only the
 *  point's position from it (see `LightingLampSummary`). */
export const useLightingLampSummary = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.lampSummary(solutionId ?? 0),
    queryFn: () =>
      getLightingLampSummaryAPI(solutionId!).then((r) => unwrapLightingResponse<LightingLampSummary>(r.data)),
    enabled: isSolutionId(solutionId),
  })

/** The last 7 days' working / not-working tally of a lamp point. */
export const useLightingLampsWeekly = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.lampsWeekly(solutionId ?? 0),
    queryFn: () =>
      getLightingLampsWeeklyAPI(solutionId!).then((r) => unwrapLightingResponse<LightingLampWeekly>(r.data)),
    enabled: isSolutionId(solutionId),
  })

/** The point's average current per hour (`/lamps/current/hourly`) — `date`
 *  "YYYY-MM-DD", BE's today (Bangkok) when omitted. */
export const useLightingLampsCurrentHourly = (solutionId: number | null | undefined, date?: string) =>
  useQuery({
    queryKey: lightingKeys.lampsCurrentHourly(solutionId ?? 0, date ?? null),
    queryFn: () =>
      getLightingLampsCurrentHourlyAPI(solutionId!, date).then((r) =>
        unwrapLightingResponse<LightingLampCurrentHourly>(r.data)),
    enabled: isSolutionId(solutionId),
  })

/** One lamp's (`/lamps/{device_id}/current/hourly`). `deviceId` as `/lamps`
 *  sent it, trailing spaces and all — trimmed, BE answers 404. */
export const useLightingLampCurrentHourly = (
  solutionId: number | null | undefined,
  deviceId: string | null | undefined,
  date?: string,
) =>
  useQuery({
    queryKey: lightingKeys.lampCurrentHourly(solutionId ?? 0, deviceId ?? '', date ?? null),
    queryFn: () =>
      getLightingLampCurrentHourlyAPI(solutionId!, deviceId!, date).then((r) =>
        unwrapLightingResponse<LightingLampCurrentHourly>(r.data)),
    enabled: isSolutionId(solutionId) && !!deviceId,
  })
