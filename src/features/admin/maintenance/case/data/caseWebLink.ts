import { buildSolutionDetailUrl } from '@/features/admin/settings/new-detail/project/data/solutionDetailUrl'

/** Where the case page's ไปยังหน้าเว็บ goes: the solution's own page in its
 *  menu — e.g. /admin/cctv/detail/5479?dept_id=0 — through the same builder as
 *  the settings page's ไปยังหน้าเว็บ (user 2026-09-29). The case title's back
 *  arrow is what returns to the maintenance detail. */
export type CaseWebLink =
  | { kind: 'ready'; href: string }
  | { kind: 'loading' }
  | { kind: 'blocked'; reason: string }

/** The maintenance menu's `?prefix=` (see detail/screen SOLUTION_PREFIXES),
 *  as the solution-type id the builder takes. */
const PREFIX_TYPE: Record<string, number> = {
  cctv: 1,
  counting: 2,
  analytic: 3,
  traffic: 4,
  crosswalk: 5,
  lighting: 6,
  vms: 7,
  tunnel: 8,
  wim: 9,
}

export const solutionTypeFromPrefix = (prefix: string | null | undefined): number | undefined =>
  prefix ? PREFIX_TYPE[prefix.toLowerCase()] : undefined

export interface CaseWebLinkInput {
  solutionId?: number
  /** GET /manage/solution/details/{id}. */
  solution?: { solution_type_id: number; solution_location_id: number } | null
  /** GET /manage/solution/road_solution?project_id= — the road whose จุดติดตั้ง
   *  holds the solution carries the bureau the target page lists it under
   *  (the project's own can differ, and then that page finds nothing). */
  roads?: {
    project_id: number
    road_id: number
    road?: { department_id?: number | null } | null
    solution_locations?: { solution_location_id: number }[] | null
  }[] | null
  /** The maintenance detail page's `prefix` / `dept_id` / `road_id`, when the
   *  URL's context belongs to this solution — for whoever can't read the two
   *  calls above (role user gets 403 on road_solution). */
  context?: { typeId?: number; deptId?: string | null; roadId?: string | null } | null
  projectId?: number | null
  isWarranty?: boolean | null
  /** One of the lookups is still on its way. */
  pending: boolean
}

export const resolveCaseWebLink = (input: CaseWebLinkInput): CaseWebLink => {
  const { solutionId, solution, roads, context, projectId, isWarranty, pending } = input
  if (!solutionId) return { kind: 'blocked', reason: 'ยังไม่ทราบประเภทงานของ Case นี้' }
  if (pending) return { kind: 'loading' }

  const typeId = solution?.solution_type_id ?? context?.typeId
  if (typeId == null) return { kind: 'blocked', reason: 'ยังไม่ทราบประเภทงานของ Case นี้' }

  const road = solution
    ? (roads ?? []).find((row) =>
      (row.solution_locations ?? []).some((location) => location.solution_location_id === solution.solution_location_id))
    : undefined
  const target = buildSolutionDetailUrl(typeId, solutionId, {
    deptId: road ? road.road?.department_id : context?.deptId,
    projectId: road?.project_id ?? projectId,
    roadId: road?.road_id ?? context?.roadId,
    isWarranty,
  })
  if (target.kind === 'ready') return target
  if (target.kind === 'blocked') return target
  // Street Light is addressed by its device's IMEI; it has no cameras, so no
  // case should belong to one.
  return { kind: 'blocked', reason: 'Street Light เปิดหน้าเว็บจากหน้านี้ไม่ได้' }
}
