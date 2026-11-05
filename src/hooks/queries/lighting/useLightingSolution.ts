import { useQuery } from '@tanstack/react-query'
import { getLightingSolutionAPI } from '@/services/routes/LightingService'
import type { LightingSolutionDetail } from '@/types/lighting'
import { lightingKeys } from './queryKeys'
import { unwrapLightingResponse } from './unwrapLightingResponse'

/** One install point (`/lighting/solutions/{solution_id}`) — for a lamp point,
 *  its LoRa gateway's tally and every lamp. Idle until the solution id is
 *  known (the lamp page resolves it from the central list). */
export const useLightingSolution = (solutionId: number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.solution(solutionId ?? 0),
    queryFn: () =>
      getLightingSolutionAPI(solutionId!).then((r) => unwrapLightingResponse<LightingSolutionDetail>(r.data)),
    enabled: solutionId != null && solutionId > 0,
  })
