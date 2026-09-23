import { useQuery } from '@tanstack/react-query'
import { getRoadSolutionsAPI } from '@/services/routes/SolutionService'
import { manageKeys } from './queryKeys'

/** สายทาง for a solution its own menu cannot see yet.
 *
 *  counting, analytic, traffic and crosswalk all build their overview and
 *  central-list responses off their per-camera link table, and read road_code
 *  through the CAMERA's road (`cctv.tbl_camera.road_id`) rather than the
 *  solution's own project_road. A solution with no camera attached is
 *  therefore either missing from the response entirely (counting / analytic —
 *  the link table IS the anchor table) or present with a null road_code
 *  (traffic / crosswalk — the camera join is a LEFT JOIN off the parent row).
 *  Either way the detail header falls back to '-' for สายทาง, which is what
 *  you see when the page is opened from settings before equipment is attached.
 *
 *  The project structure knows the road regardless of equipment, so this
 *  resolves it from the `project_id` + `road_id` the navigation already
 *  carries. Shares `manageKeys.roadSolutions.byProject` (same key AND same
 *  unwrapped shape as `useRoadSolutions`), so the settings page's copy is
 *  reused when there is one.
 *
 *  `enabled` is the caller's "the primary lookup failed" flag — a detail page
 *  whose menu already resolved the road pays nothing for this.
 */
export const useSolutionRoadFallback = (
  projectId: string | number | null | undefined,
  roadId: string | number | null | undefined,
  enabled: boolean,
): string | null => {
  const numericProjectId = Number(projectId)
  const numericRoadId = Number(roadId)
  const canResolve =
    enabled &&
    Number.isInteger(numericProjectId) && numericProjectId > 0 &&
    Number.isInteger(numericRoadId) && numericRoadId > 0

  const { data } = useQuery({
    queryKey: manageKeys.roadSolutions.byProject(canResolve ? numericProjectId : ''),
    queryFn: () => getRoadSolutionsAPI(numericProjectId).then((r) => r.data),
    enabled: canResolve,
  })

  if (!canResolve) return null
  const road = data?.find((item) => item.road_id === numericRoadId)?.road
  return road?.road_code?.trim() || null
}
