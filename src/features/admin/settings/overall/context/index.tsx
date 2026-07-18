"use client"
import { message } from 'antd'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  useCreateProject,
  useDeleteProject,
  useDepartments,
  useProjectsList,
  useUpdateProject,
} from '@/hooks/queries/manage'
import type { APIResponseProject } from '@/types/manage/project-api'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { Project, ProjectFilters, ProjectFormValues, ViewMode } from '../types/project'
import { DEFAULT_PAGE_SIZE } from '../utils/paginationConfig'

const DEFAULT_FILTERS: ProjectFilters = {
  budgetYear: null,
  owner: null,
  contractor: null,
  search: '',
}

export interface ContextProps {
  projects: Project[]
  /** Rows shown in the table — the current server page mapped to UI shape,
   *  further narrowed by the client-side dropdown filters (budgetYear /
   *  owner / contractor). Server handles `search` + pagination. */
  filtered: Project[]
  filters: ProjectFilters
  setFilters: (patch: Partial<ProjectFilters>) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  page: number
  pageSize: number
  setPage: (p: number) => void
  setPageSize: (size: number) => void
  /** Total rows on the server (from meta_data.count) — the AntD Table needs
   *  this to render correct pagination since dataSource is only one page. */
  total: number
  /** Total pages on the server (from meta_data.total_pages). */
  totalPages: number
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  createProject: (values: ProjectFormValues) => Promise<void>
  updateProject: (id: string, values: ProjectFormValues) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  isSubmitting: boolean
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

// Maps an APIResponseProject row → UI Project. The department label is
// resolved client-side against the /departments dropdown so the table shows
// "ขทช.สมุทรปราการ" instead of a raw numeric id. Roads are left empty on the
// list because the list endpoint doesn't return `project_road`; the edit
// modal calls useProjectDetail(id) when it needs them.
const mapProject = (
  api: APIResponseProject,
  departments: APIResponseDepartment[] | undefined,
): Project => {
  const dept = departments?.find((d) => d.id === api.department_id)
  const contractorCompany =
    api.contractor?.contractor?.company_name ??
    api.contractor?.contractor?.short_name ??
    '-'
  return {
    id: String(api.id),
    code: api.project_no || '-',
    name: api.project_name,
    budgetYear: api.budget_year,
    contractNo: api.contract_no,
    contractor: contractorCompany,
    owner: dept?.department_short_name ?? '-',
    // List endpoint doesn't ship project_road — modal fetches detail on edit.
    roads: [],
    warrantyStart: api.warranty_start_date,
    warrantyEnd: api.warranty_end_date,
    warrantyStatus: api.is_warranty ? 'in-warranty' : 'expired',
  }
}

const errText = (err: unknown, fallback: string): string => {
  if (!err) return fallback
  const anyErr = err as {
    response?: { data?: { details?: unknown; res_data?: { details?: unknown } } }
    message?: string
  }
  const details =
    anyErr?.response?.data?.res_data?.details ??
    anyErr?.response?.data?.details
  if (typeof details === 'string') return details
  if (details && typeof details === 'object') return JSON.stringify(details)
  if (anyErr?.message) return anyErr.message
  return fallback
}

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props

  const [filters, setFiltersState] = useState<ProjectFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)

  // Changing page size should reset to page 1 — otherwise the user could
  // sit on e.g. page 4 with a size of 20 (rows 61-80) then swap to 100 and
  // land on a page that doesn't exist.
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
  }, [])

  // Server-side paging + search. Cache slot is keyed on {page, limit, search}
  // in the hook, so each combination is its own React-Query entry.
  const projectsQuery = useProjectsList({
    page,
    limit: pageSize,
    search: filters.search.trim() || undefined,
  })
  const departmentsQuery = useDepartments()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

  // Only the server-backed `search` field resets pagination. The dropdown
  // filters (budgetYear / owner / contractor) are applied client-side over
  // the current page, so changing them shouldn't jump the user off the page
  // they're viewing.
  const setFilters = useCallback((patch: Partial<ProjectFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    if (Object.prototype.hasOwnProperty.call(patch, 'search')) {
      setPage(1)
    }
  }, [])

  // The list hook returns the raw envelope `{ res_data, meta_data }`.
  const meta = projectsQuery.data?.meta_data
  const total = meta?.count ?? 0
  const totalPages = meta?.total_pages ?? 0

  const projects = useMemo<Project[]>(() => {
    const rows = projectsQuery.data?.res_data ?? []
    return rows.map((r) => mapProject(r, departmentsQuery.data))
  }, [projectsQuery.data, departmentsQuery.data])

  // Client-side narrowing of the current page for the dropdown filters that
  // the backend doesn't understand. Search is already applied server-side, so
  // it isn't reapplied here.
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filters.budgetYear && p.budgetYear !== filters.budgetYear) return false
      if (filters.owner && p.owner !== filters.owner) return false
      if (filters.contractor && p.contractor !== filters.contractor) return false
      return true
    })
  }, [projects, filters.budgetYear, filters.owner, filters.contractor])

  const createProject = useCallback(
    async (values: ProjectFormValues) => {
      try {
        await createMutation.mutateAsync({
          budget_year: values.budgetYear as number,
          contract_no: values.contractNo,
          project_no: values.code || '',
          project_name: values.name,
          department_id: Number(values.owner),
          contractor_id: values.contractor,
          warranty_start_date: values.warrantyStart,
          warranty_end_date: values.warrantyEnd,
          // Create-flow: no existing project_road ids yet.
          project_road: values.roads.map((r) => ({ road_id: Number(r.roadId) })),
        })
        message.success('เพิ่มโครงการสำเร็จ')
      } catch (err) {
        message.error(errText(err, 'เพิ่มโครงการไม่สำเร็จ'))
        throw err
      }
    },
    [createMutation],
  )

  const updateProject = useCallback(
    async (id: string, values: ProjectFormValues) => {
      try {
        await updateMutation.mutateAsync({
          id: Number(id),
          budget_year: values.budgetYear as number,
          contract_no: values.contractNo,
          project_no: values.code || '',
          project_name: values.name,
          department_id: Number(values.owner),
          contractor_id: values.contractor,
          warranty_start_date: values.warrantyStart,
          warranty_end_date: values.warrantyEnd,
          // Echo project_road_id for existing rows so the backend updates in
          // place; rows without it are new inserts. Rows removed from the
          // form are absent here — the backend deletes them by diffing
          // (see manage/projects/repository.go:PutProject).
          project_road: values.roads.map((r) => ({
            road_id: Number(r.roadId),
            ...(r.projectRoadId ? { project_road_id: r.projectRoadId } : {}),
          })),
        })
        message.success('แก้ไขโครงการสำเร็จ')
      } catch (err) {
        message.error(errText(err, 'แก้ไขโครงการไม่สำเร็จ'))
        throw err
      }
    },
    [updateMutation],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(Number(id))
        message.success('ลบโครงการสำเร็จ')
      } catch (err) {
        message.error(errText(err, 'ลบโครงการไม่สำเร็จ'))
        throw err
      }
    },
    [deleteMutation],
  )

  // Include `isFetching` so the table shows a spinner during page transitions
  // even though `placeholderData: keepPreviousData` keeps the old rows on
  // screen. Without it, paging looks silently stuck.
  const isLoading =
    projectsQuery.isLoading ||
    projectsQuery.isFetching ||
    departmentsQuery.isLoading
  const isError = projectsQuery.isError
  const errorMessage = projectsQuery.isError
    ? errText(projectsQuery.error, 'ไม่สามารถโหลดข้อมูลโครงการได้')
    : null
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  const value = useMemo<ContextProps>(
    () => ({
      projects,
      filtered,
      filters,
      setFilters,
      viewMode,
      setViewMode,
      page,
      pageSize,
      setPage,
      setPageSize,
      total,
      totalPages,
      isLoading,
      isError,
      errorMessage,
      createProject,
      updateProject,
      deleteProject,
      isSubmitting,
    }),
    [
      projects,
      filtered,
      filters,
      setFilters,
      viewMode,
      page,
      pageSize,
      setPageSize,
      total,
      totalPages,
      isLoading,
      isError,
      errorMessage,
      createProject,
      updateProject,
      deleteProject,
      isSubmitting,
    ],
  )

  return <OverallContext.Provider value={value}>{children}</OverallContext.Provider>
}

export const useOverallContext = () => {
  const context = useContext(OverallContext)
  if (!context) {
    throw new Error('useOverallContext must be used within a OverallProvider')
  }
  return context
}
