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
} as const
