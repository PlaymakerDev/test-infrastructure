"use client"
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MOCK_PROJECTS } from '../data/mockProjects'
import type { Project, ProjectFilters, ProjectFormValues, ViewMode } from '../types/project'

const DEFAULT_FILTERS: ProjectFilters = {
  budgetYear: null,
  owner: null,
  contractor: null,
  search: '',
}

export interface ContextProps {
  projects: Project[]
  filtered: Project[]
  filters: ProjectFilters
  setFilters: (patch: Partial<ProjectFilters>) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  page: number
  pageSize: number
  setPage: (p: number) => void
  createProject: (values: ProjectFormValues) => Project
  updateProject: (id: string, values: ProjectFormValues) => void
  deleteProject: (id: string) => void
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<ContextProps | null>(null)

const genId = () => `p-${Math.floor(Math.random() * 1_000_000).toString(36)}`

const toProject = (id: string, v: ProjectFormValues): Project => ({
  id,
  code: v.code || '-',
  name: v.name,
  budgetYear: v.budgetYear ?? new Date().getFullYear() + 543,
  contractNo: v.contractNo,
  contractor: v.contractor,
  owner: v.owner,
  roads: v.roads.map((code) => ({ id: `r-${code}`, code })),
  warrantyStart: v.warrantyStart,
  warrantyEnd: v.warrantyEnd,
  warrantyStatus: 'delivering',
})

export const OverallProvider = (props: PageProviderProps) => {
  const { children } = props

  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [filters, setFiltersState] = useState<ProjectFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const setFilters = useCallback((patch: Partial<ProjectFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return projects.filter((p) => {
      if (filters.budgetYear && p.budgetYear !== filters.budgetYear) return false
      if (filters.owner && p.owner !== filters.owner) return false
      if (filters.contractor && p.contractor !== filters.contractor) return false
      if (q) {
        const hay = `${p.name} ${p.code} ${p.contractNo}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [projects, filters])

  const createProject = useCallback((values: ProjectFormValues) => {
    const created = toProject(genId(), values)
    setProjects((prev) => [created, ...prev])
    return created
  }, [])

  const updateProject = useCallback((id: string, values: ProjectFormValues) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? toProject(id, values) : p)))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

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
      createProject,
      updateProject,
      deleteProject,
    }),
    [projects, filtered, filters, setFilters, viewMode, page, createProject, updateProject, deleteProject],
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
