"use client"
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { emptyProjectDetail, MOCK_PROJECT_DETAIL } from '../data/mockProjectDetail'
import type { Equipment, InstallPoint, ProjectDetail, RouteDetail, TaskKind, TaskType } from '../types'

const genId = (prefix: string) => `${prefix}-${Math.floor(Math.random() * 1_000_000).toString(36)}`

export interface ContextProps {
  project: ProjectDetail
  activeRouteId: string
  activePointId: string | null
  setActiveRouteId: (id: string) => void
  setActivePointId: (id: string) => void

  addPoint: (roadId: string, name: string) => void
  updatePoint: (roadId: string, pointId: string, name: string) => void
  removePoint: (roadId: string, pointId: string) => boolean

  addTaskType: (roadId: string, pointId: string, task: Omit<TaskType, 'id' | 'equipment' | 'equipmentRefs'>) => void
  removeTaskType: (roadId: string, pointId: string, taskId: string) => boolean

  addEquipment: (roadId: string, pointId: string, taskId: string, equip: Omit<Equipment, 'id' | 'isOnline' | 'streamConnected' | 'lastUpdated'>) => void
  removeEquipment: (taskId: string, equipmentId: string) => boolean
  updateEquipmentRefs: (roadId: string, pointId: string, taskId: string, refIds: string[]) => void
}

export interface PageProviderProps {
  children: React.ReactNode
  projectId: string
}

export const ProjectDetailContext = createContext<ContextProps | null>(null)

export const ProjectDetailProvider = ({ children, projectId }: PageProviderProps) => {
  const initial = useMemo(
    () => MOCK_PROJECT_DETAIL[projectId] ?? emptyProjectDetail(projectId),
    [projectId],
  )
  const [project, setProject] = useState<ProjectDetail>(initial)
  const [activeRouteId, setActiveRouteId] = useState<string>(initial.routes[0]?.id ?? '')
  const [activePointId, setActivePointId] = useState<string | null>(
    initial.routes[0]?.points[0]?.id ?? null,
  )

  const mutateRoute = useCallback(
    (roadId: string, fn: (route: RouteDetail) => RouteDetail) => {
      setProject((prev) => ({
        ...prev,
        routes: prev.routes.map((r) => (r.id === roadId ? fn(r) : r)),
      }))
    },
    [],
  )

  const mutatePoint = useCallback(
    (roadId: string, pointId: string, fn: (p: InstallPoint) => InstallPoint) => {
      mutateRoute(roadId, (r) => ({
        ...r,
        points: r.points.map((p) => (p.id === pointId ? fn(p) : p)),
      }))
    },
    [mutateRoute],
  )

  const addPoint = useCallback(
    (roadId: string, name: string) => {
      const point: InstallPoint = { id: genId('pt'), name, taskTypes: [] }
      mutateRoute(roadId, (r) => ({ ...r, points: [...r.points, point] }))
      setActivePointId(point.id)
    },
    [mutateRoute],
  )

  const updatePoint = useCallback(
    (roadId: string, pointId: string, name: string) => {
      mutatePoint(roadId, pointId, (p) => ({ ...p, name }))
    },
    [mutatePoint],
  )

  const removePoint = useCallback(
    (roadId: string, pointId: string) => {
      const route = project.routes.find((r) => r.id === roadId)
      const point = route?.points.find((p) => p.id === pointId)
      if (!point) return false
      if (point.taskTypes.length > 0) return false
      mutateRoute(roadId, (r) => ({ ...r, points: r.points.filter((p) => p.id !== pointId) }))
      if (activePointId === pointId) {
        const remaining = route!.points.filter((p) => p.id !== pointId)
        setActivePointId(remaining[0]?.id ?? null)
      }
      return true
    },
    [project, mutateRoute, activePointId],
  )

  const addTaskType = useCallback(
    (roadId: string, pointId: string, task: Omit<TaskType, 'id' | 'equipment' | 'equipmentRefs'>) => {
      const created: TaskType = {
        ...task,
        id: genId('tt'),
        equipment: [],
        equipmentRefs: task.kind === 'CCTV' ? undefined : [],
      }
      mutatePoint(roadId, pointId, (p) => ({ ...p, taskTypes: [...p.taskTypes, created] }))
    },
    [mutatePoint],
  )

  const removeTaskType = useCallback(
    (roadId: string, pointId: string, taskId: string) => {
      const route = project.routes.find((r) => r.id === roadId)
      const point = route?.points.find((p) => p.id === pointId)
      const task = point?.taskTypes.find((t) => t.id === taskId)
      if (!task) return false
      const hasEquipment = task.kind === 'CCTV' ? task.equipment.length > 0 : (task.equipmentRefs?.length ?? 0) > 0
      if (hasEquipment) return false
      mutatePoint(roadId, pointId, (p) => ({
        ...p,
        taskTypes: p.taskTypes.filter((t) => t.id !== taskId),
      }))
      return true
    },
    [project, mutatePoint],
  )

  const addEquipment = useCallback(
    (roadId: string, pointId: string, taskId: string, equip: Omit<Equipment, 'id' | 'isOnline' | 'streamConnected' | 'lastUpdated'>) => {
      const created: Equipment = {
        ...equip,
        id: genId('eq'),
        isOnline: true,
        streamConnected: true,
        lastUpdated: new Date().toISOString(),
      }
      mutatePoint(roadId, pointId, (p) => ({
        ...p,
        taskTypes: p.taskTypes.map((t) => (t.id === taskId ? { ...t, equipment: [...t.equipment, created] } : t)),
      }))
    },
    [mutatePoint],
  )

  const removeEquipment = useCallback(
    (taskId: string, equipmentId: string) => {
      const referencedIn: TaskKind[] = []
      project.routes.forEach((r) =>
        r.points.forEach((p) =>
          p.taskTypes.forEach((t) => {
            if (t.id === taskId) return
            if (t.equipmentRefs?.includes(equipmentId)) referencedIn.push(t.kind)
          }),
        ),
      )
      if (referencedIn.length > 0) return false
      setProject((prev) => ({
        ...prev,
        routes: prev.routes.map((r) => ({
          ...r,
          points: r.points.map((p) => ({
            ...p,
            taskTypes: p.taskTypes.map((t) =>
              t.id === taskId ? { ...t, equipment: t.equipment.filter((e) => e.id !== equipmentId) } : t,
            ),
          })),
        })),
      }))
      return true
    },
    [project],
  )

  const updateEquipmentRefs = useCallback(
    (roadId: string, pointId: string, taskId: string, refIds: string[]) => {
      mutatePoint(roadId, pointId, (p) => ({
        ...p,
        taskTypes: p.taskTypes.map((t) => (t.id === taskId ? { ...t, equipmentRefs: refIds } : t)),
      }))
    },
    [mutatePoint],
  )

  const value = useMemo<ContextProps>(
    () => ({
      project,
      activeRouteId,
      activePointId,
      setActiveRouteId,
      setActivePointId,
      addPoint,
      updatePoint,
      removePoint,
      addTaskType,
      removeTaskType,
      addEquipment,
      removeEquipment,
      updateEquipmentRefs,
    }),
    [
      project,
      activeRouteId,
      activePointId,
      addPoint,
      updatePoint,
      removePoint,
      addTaskType,
      removeTaskType,
      addEquipment,
      removeEquipment,
      updateEquipmentRefs,
    ],
  )

  return <ProjectDetailContext.Provider value={value}>{children}</ProjectDetailContext.Provider>
}

export const useProjectDetailContext = () => {
  const context = useContext(ProjectDetailContext)
  if (!context) {
    throw new Error('useProjectDetailContext must be used within a ProjectDetailProvider')
  }
  return context
}
