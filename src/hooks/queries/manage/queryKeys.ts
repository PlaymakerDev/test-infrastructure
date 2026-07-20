// Centralized query-key factory for the Settings (/api-v2/manage/*) feature.
// Each entity has an `.all` root so mutations can call
// `queryClient.invalidateQueries({ queryKey: manageKeys.<entity>.all })` and
// fan out to every list/detail query below it — including every
// (page, limit, search) cache slot appended after 'list'.

import type { ListParams } from '@/types/manage/params'

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
    detail: (id: string | number) =>
      [...manageKeys.projects.all, 'detail', id] as const,
    /** GET /manage/project/case/{case_no} — project resolved by repair case_no. */
    byCaseNo: (caseNo: string) =>
      [...manageKeys.projects.all, 'by-case-no', caseNo] as const,
  },

  contractors: {
    all: ['manage', 'contractors'] as const,
    list: (params: ListParams = {}) =>
      [...manageKeys.contractors.all, 'list', listKey(params)] as const,
  },

  roads: {
    all: ['manage', 'roads'] as const,
    list: (params: ListParams = {}) =>
      [...manageKeys.roads.all, 'list', listKey(params)] as const,
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
    /** GET /solution/camera/list/{solution_location_id} — CCTVs at a location. */
    camerasAtLocation: (solutionLocationId: number | string) =>
      [...manageKeys.solutions.all, 'cameras-at-location', solutionLocationId] as const,
    /** GET /solution/camera/vms/{solution_id} */
    vmsCameras: (solutionId: number | string) =>
      [...manageKeys.solutions.all, 'vms-cameras', solutionId] as const,
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
  },
} as const
