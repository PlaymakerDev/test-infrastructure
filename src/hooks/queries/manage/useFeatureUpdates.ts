import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { getFeatureUpdatesAPI } from '@/services/routes/ManageService'
import type { APIResponseFeatureUpdates, FeatureUpdate } from '@/types/manage/feature-update-api'
import { manageKeys } from './queryKeys'

export interface FeatureUpdatesResult {
  /** Newest active notice per feature key; keys with none are absent. */
  latest: Record<string, FeatureUpdate>
  /** Every request has finished, successfully or not. */
  settled: boolean
}

// Module-level so TanStack re-runs it only when a query result changes — an
// inline combine would hand back a new object on every render.
const combine = (results: UseQueryResult<APIResponseFeatureUpdates>[]): FeatureUpdatesResult => {
  const latest: Record<string, FeatureUpdate> = {}
  for (const result of results) {
    const newest = result.data?.[0]
    if (newest) latest[newest.feature] = newest
  }
  return { latest, settled: results.every((r) => !r.isPending) }
}

/** Active feature-update notices for several feature keys at once. The API
 *  has no "all features" endpoint, so this is one small request per key. */
export const useFeatureUpdates = (features: readonly string[]) =>
  useQueries({
    queries: features.map((feature) => ({
      queryKey: manageKeys.featureUpdates.byFeature(feature),
      queryFn: () => getFeatureUpdatesAPI(feature).then((r) => r.data),
      staleTime: 60_000,
    })),
    combine,
  })
