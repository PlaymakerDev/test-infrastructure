import { useQuery } from '@tanstack/react-query'

import { getLightingOverviewAPI } from '@/services/routes/LightingService'

import type { LightingOverviewResponse } from '@/types/lighting'

import { lightingKeys } from './queryKeys'

import { unwrapLightingResponse } from './unwrapLightingResponse'



const isEnabledDept = (deptId: string | number | null | undefined) =>

  deptId !== null && deptId !== undefined && String(deptId) !== ''



/** Map locations + centroid for the Traffic Lighting overall page. */

export const useLightingOverview = (deptId: string | number | null | undefined) =>

  useQuery({

    queryKey: lightingKeys.overview.map(deptId ?? ''),

    queryFn: () =>

      getLightingOverviewAPI(Number(deptId)).then((r) =>

        unwrapLightingResponse<LightingOverviewResponse>(r.data),

      ),

    enabled: isEnabledDept(deptId),

  })

