// Centralized query-key factory for the Settings (/api-v2/manage/*) feature.
// Each entity has an `.all` root so mutations can call
// `queryClient.invalidateQueries({ queryKey: manageKeys.<entity>.all })` and
// fan out to every list/detail query below it — including every
// (page, limit, search) cache slot appended after 'list'.

import type { ListParams, RoadListParams } from '@/types/manage/params'
import type { APIRequestProjectDepartment, APIRequestProjectList } from '@/types/manage/project-api'
import type { APIRequestPaginateRoadList } from '@/types/manage/road-api'

// Normalize `ListParams` into a stable object used as the trailing key node
// so React Query cache-slots per unique (page, limit, search). Undefined /
// empty values collapse to sane defaults, matching what the section UI
// actually renders (page 1, first-page load, empty search).
const listKey = (params: ListParams = {}) => ({
  page: params.page ?? 1,
  limit: params.limit ?? 20,
  search: params.search ?? '',
})

export const manageKeys = {
  all: ['manage'] as const,

  projects: {
    all: ['manage', 'projects'] as const,
    list: (params: ListParams = {}) =>
      [...manageKeys.projects.all, 'list', listKey(params)] as const,
    /** NewProjectSection's variant — same /manage/project list endpoint, but
     *  the new search form also filters by budget_year/department_id/
     *  contractor_id/sort, none of which `listKey` captures. A separate key
     *  (not a widened `list` above) so `useProjectsList`'s existing callers
     *  are untouched. */
    listFiltered: (params: APIRequestProjectList = {}) =>
      [
        ...manageKeys.projects.all,
        'list-filtered',
        {
          ...listKey(params),
          budget_year: params.budget_year ?? 0,
          department_id: params.department_id ?? 0,
          contractor_id: params.contractor_id ?? '',
          field: params.field ?? '',
          sort: params.sort ?? '',
        },
      ] as const,
    detail: (id: string | number) =>
      [...manageKeys.projects.all, 'detail', id] as const,
    /** GET /manage/project/case/{case_no} — project resolved by repair case_no. */
    byCaseNo: (caseNo: string) =>
      [...manageKeys.projects.all, 'by-case-no', caseNo] as const,
    /** GET /manage/project/department — the grid view's department-grouped
     *  list. Infinite-scroll variant, mirrors contractors.listInfinite's
     *  (limit, search)-only key shape (page is managed internally by
     *  useInfiniteQuery, not part of the cache slot). */
    departmentsInfinite: (params: Omit<APIRequestProjectDepartment, 'page'> = {}) =>
      [
        ...manageKeys.projects.all,
        'departments-infinite',
        { limit: params.limit ?? 10, search: params.search ?? '' },
      ] as const,
    /** GRID view's CollapseDeptCard — one project list per department card,
     *  paginated/filtered the same way listFiltered is but scoped to a
     *  single department_id. Nested under the same `projects.all` prefix
     *  (unlike a raw ad-hoc key) so create/update/delete invalidation
     *  reaches every open department card, not just the LIST view. */
    byDepartment: (departmentId: number, params: Omit<APIRequestProjectList, 'department_id'> = {}) =>
      [
        ...manageKeys.projects.all,
        'by-department',
        departmentId,
        {
          ...listKey(params),
          budget_year: params.budget_year ?? 0,
          contractor_id: params.contractor_id ?? '',
        },
      ] as const,
  },

  contractors: {
    all: ['manage', 'contractors'] as const,
    list: (params: ListParams = {}) =>
      [...manageKeys.contractors.all, 'list', listKey(params)] as const,
    /** Infinite-scroll variant — deliberately excludes `page` from the key
     *  (unlike `list` above) since useInfiniteQuery manages every fetched
     *  page under one cache slot; only (limit, search) select a slot. */
    listInfinite: (params: Omit<ListParams, 'page'> = {}) =>
      [
        ...manageKeys.contractors.all,
        'list-infinite',
        { limit: params.limit ?? 10, search: params.search ?? '' },
      ] as const,
  },

  roads: {
    all: ['manage', 'roads'] as const,
    // Roads carry two extra server-side filters (province / department_id) —
    // both are part of the key so each filter combination gets its own cache
    // slot (a key that ignored them would serve page-1-unfiltered rows to a
    // filtered view).
    list: (params: RoadListParams = {}) =>
      [
        ...manageKeys.roads.all,
        'list',
        {
          ...listKey(params),
          province: params.province ?? '',
          department_id: params.department_id ?? 0,
        },
      ] as const,
    /** NewRoadSection's variant — same /manage/roads endpoint, but grouped
     *  server-side by region/department (RoadData) and filtered by
     *  region_id instead of province/department_id. Nested under the same
     *  `roads.all` prefix so create/update/delete invalidation reaches this
     *  view too, not just the LIST view's `list` key above. */
    listFiltered: (params: APIRequestPaginateRoadList = {}) =>
      [
        ...manageKeys.roads.all,
        'list-filtered',
        {
          ...listKey(params),
          region_id: params.region_id ?? 0,
          department_id: params.department_id ?? 0,
        },
      ] as const,
  },

  users: {
    all: ['manage', 'users'] as const,
    list: (params: ListParams = {}) =>
      [...manageKeys.users.all, 'list', listKey(params)] as const,
  },

  // Dropdown data — split under its own root so a project mutation doesn't
  // invalidate the budget-year list (which lives independently of a single
  // project's edits).
  dropdowns: {
    all: ['manage', 'dropdowns'] as const,
    budgetYears: () => [...manageKeys.dropdowns.all, 'budget-years'] as const,
    contractors: () => [...manageKeys.dropdowns.all, 'contractors'] as const,
    departments: () => [...manageKeys.dropdowns.all, 'departments'] as const,
    provinces: () => [...manageKeys.dropdowns.all, 'provinces'] as const,
    regions: () => [...manageKeys.dropdowns.all, 'regions'] as const,
  },

  // LDAP AD search (via the backend `/api-v2/auth/ldap` endpoint). Keyed
  // by the trimmed & lower-cased keyword so "Sit " and "sit" share the same
  // cache slot; short/empty inputs are gated by the hook's `enabled` guard,
  // not by the key.
  sso: {
    all: ['manage', 'sso'] as const,
    search: (keyword: string) =>
      [...manageKeys.sso.all, 'search', keyword.trim().toLowerCase()] as const,
  },

  // Project detail resources — road_solution (routes + installation
  // points), solutions (task types), cameras.
  roadSolutions: {
    all: ['manage', 'road-solutions'] as const,
    /** GET /solution/road_solution?project_id — full route tree of a project. */
    byProject: (projectId: number | string) =>
      [...manageKeys.roadSolutions.all, 'by-project', projectId] as const,
  },
  solutions: {
    all: ['manage', 'solutions'] as const,
    /** GET /solution?solution_location_id — solutions at a location. */
    byLocation: (solutionLocationId: number | string) =>
      [...manageKeys.solutions.all, 'by-location', solutionLocationId] as const,
    /** GET /solution/details/{id} */
    detail: (id: number | string) =>
      [...manageKeys.solutions.all, 'detail', id] as const,
    /** GET /solution/type/{solution_location_id} — task type presence + counts. */
    typesAtLocation: (solutionLocationId: number | string) =>
      [...manageKeys.solutions.all, 'types-at-location', solutionLocationId] as const,
    /** GET /solution/camera/list/{solution_location_id} — CCTVs at a location.
     *  Point-scoped: this is what the Counting/Analytic/Crosswalk/WIM camera
     *  pickers read. For the whole road use camerasAtProjectRoad below. */
    camerasAtLocation: (solutionLocationId: number | string) =>
      [...manageKeys.solutions.all, 'cameras-at-location', solutionLocationId] as const,
    /** GET /solution/camera/by_project_road/{project_road_id} — the road's one
     *  CCTV solution plus every camera under it, each tagged with its own
     *  install point. Backs the road-level อุปกรณ์ CCTV panel. */
    camerasAtProjectRoad: (projectRoadId: number | string) =>
      [...manageKeys.solutions.all, 'cameras-at-project-road', projectRoadId] as const,
    /** GET /solution/camera/vms/{solution_id} */
    vmsCameras: (solutionId: number | string) =>
      [...manageKeys.solutions.all, 'vms-cameras', solutionId] as const,
    /** GET /solution/vms/solution/{solution_id} — provisioning state for the form. */
    vmsSolution: (solutionId: number | string) =>
      [...manageKeys.solutions.all, 'vms-solution', solutionId] as const,
    /** GET /solution/camera/crossing_codes/{solution_id} */
    crossingCodes: (solutionId: number | string) =>
      [...manageKeys.solutions.all, 'crossing-codes', solutionId] as const,
  },
  equipments: {
    all: ['manage', 'equipments'] as const,
    list: (params: Record<string, unknown>) =>
      [...manageKeys.equipments.all, 'list', params] as const,
  },
  solutionTypes: {
    /** GET /solution/type — the master list of the ~10 solution kinds. */
    all: () => ['manage', 'solution-types', 'master'] as const,
  },

  // Notifications summary — one bucket per source_type (analytic / lighting /
  // vms_setting) over a date window. Keyed by the window so the dashboard
  // pill can share a slot with any drawer that opens the same range.
  notifications: {
    all: ['manage', 'notifications'] as const,
    summary: (params: { start_date: string; end_date: string }) =>
      [...manageKeys.notifications.all, 'summary', params] as const,
    /** Prefix for the whole bell feed — invalidate this after mark-read. */
    feed: () => [...manageKeys.notifications.all, 'feed'] as const,
    /** Bell badge, one per kind — unread_only&limit=1 poll; the value lives in
     *  meta_data.count. Cases and camera outages are counted apart because
     *  the bell shows them as two numbers. */
    feedBadge: (kind: 'case' | 'camera_outage') =>
      [...manageKeys.notifications.feed(), 'badge', kind] as const,
    /** Panel list (infinite, page-keyed inside the query itself). */
    feedList: (params: Record<string, unknown>) =>
      [...manageKeys.notifications.feed(), 'list', params] as const,
  },

  // GET /feature-updates/:feature — the "ระบบปรับปรุง" notice, one key per menu.
  featureUpdates: {
    all: ['manage', 'feature-updates'] as const,
    byFeature: (feature: string) => [...manageKeys.featureUpdates.all, feature] as const,
  },
} as const
