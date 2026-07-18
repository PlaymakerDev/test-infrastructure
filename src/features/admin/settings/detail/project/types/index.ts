// Domain shapes for the Project detail page. Post-mock rewrite: everything
// still surfaces the same UI structure (routes → points → task types →
// cameras) but ids are the actual backend numeric primary keys so
// mutation calls can round-trip cleanly.

/** Backend solution-type ids that the detail page currently surfaces.
 *  Mirrors `SOLUTION_TYPE` in @/types/manage/solution-api. */
export type TaskKindId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** Human-facing label matching `solution_name_atlas` from
 *  GET /solution/type. Kept as a plain string for now so unknown types
 *  aren't accidentally excluded. */
export type TaskKind = string

/** One camera row surfaced in the detail modal (CCTV list, VMS list, …).
 *  A slimmed projection of `APIResponseCamera`. */
export interface Equipment {
  id: string // uuid
  name: string
  ipAddress?: string | null
  hlsUrl?: string | null
  sta?: string | null
  isOnline: boolean
  streamConnected: boolean
  lastUpdated?: string | null
}

/** One task type (Solution row) at an installation point. */
export interface TaskType {
  /** tbl_solution.id */
  id: number
  kind: TaskKind
  kindId: TaskKindId
  solutionName: string
  sta?: string | null
  ipAddress?: string | null
  ztIpAddress?: string | null
  anydesk?: string | null
  remarks?: string | null
  /** Owned equipment (populated on-demand for CCTV / VMS / Traffic). */
  equipment?: Equipment[]
  /** Camera ids referenced by non-CCTV task types (same physical camera,
   *  extra analytic). Populated by the crossing-code / attach flows. */
  equipmentRefs?: string[]
}

/** One installation point on a route. */
export interface InstallPoint {
  /** tbl_solution_location.id */
  id: number
  name: string
  /** Loaded lazily via useSolutions(activePointId). */
  taskTypes?: TaskType[]
}

/** One route (project_road) in the project. */
export interface RouteDetail {
  /** tbl_project_roads.id */
  projectRoadId: number
  roadId: number
  code: string
  name?: string | null
  points: InstallPoint[]
}

export interface ProjectDetail {
  id: number
  code: string
  name: string
  warrantyStatus: 'in-warranty' | 'expired' | 'delivering'
  routes: RouteDetail[]
}
