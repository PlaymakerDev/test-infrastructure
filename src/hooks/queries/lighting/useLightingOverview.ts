import { useQuery } from '@tanstack/react-query'

import { getLightingOverviewAPI } from '@/services/routes/LightingService'

import type { LightingOverviewResponse } from '@/types/lighting'

import { isValidLightingDeptId, lightingKeys } from './queryKeys'

import { unwrapLightingResponse } from './unwrapLightingResponse'



/** Map locations + centroid for the Traffic Lighting overall page. */

export const useLightingOverview = (deptId: string | number | null | undefined, roadId?: number | null) =>

  useQuery({

    queryKey: lightingKeys.overview.map(deptId ?? '', roadId),

    queryFn: () =>

      getLightingOverviewAPI(Number(deptId), roadId ? { road_id: roadId } : {}).then((r) =>

        unwrapLightingResponse<LightingOverviewResponse>(r.data),

      ),

    enabled: isValidLightingDeptId(deptId),

  })

