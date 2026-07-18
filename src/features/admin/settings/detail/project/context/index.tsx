"use client"
import { message } from 'antd'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useAppendVmsCameras,
  useAttachAnalyticCameras,
  useAttachCountingCameras,
  useAttachCrosswalkCameras,
  useAttachTrafficCameras,
  useAttachWimCameras,
  useCreateRoadSolution,
  useCreateSolution,
  useCreateVMSSolution,
  useDeleteProjectRoad,
  useDeleteSolution,
  useDeleteSolutionLocation,
  useProjectDetail,
  useRoadSolutions,
  useSolutionCameras,
  useSolutionTypes,
  useSolutions,
  useUpdateSolutionLocation,
} from '@/hooks/queries/manage'
import type {
  APIRequestCreateSolution,
  APIRequestCreateVMSSolution,
  APIResponseCamera,
  APIResponseRoadSolution,
  APIResponseSolution,
  SolutionTypeID,
} from '@/types/manage/solution-api'
import type {
  Equipment,
  InstallPoint,
  ProjectDetail,
  RouteDetail,
  TaskKindId,
  TaskType,
} from '../types'

// ─── Error helper (mirrors overall/context) ───────────────────────────────

const errText = (err: unknown, fallback: string): string => {
  if (!err) return fallback
  const anyErr = err as {
    response?: { data?: { details?: unknown; res_data?: { details?: unknown; message?: string } } }
    message?: string
  }
  const details =
    anyErr?.response?.data?.res_data?.details ??
    anyErr?.response?.data?.res_data?.message ??
    anyErr?.response?.data?.details
  if (typeof details === 'string') return details
  if (details && typeof details === 'object') return JSON.stringify(details)
  if (anyErr?.message) return anyErr.message
  return fallback
}

// ─── Mappers ──────────────────────────────────────────────────────────────

const mapCamera = (c: APIResponseCamera): Equipment => ({
  id: c.id,
  name: c.camera_name,
  ipAddress: c.ip_address ?? null,
  hlsUrl: c.hls_url ?? null,
  sta: c.sta ?? null,
  // `isOnline` in the equipment badge = the HLS stream serves. This is
  // the same rule the rest of the app calls "online" (see backend
  // cctv service — CameraResponse.IsOnline := CurlStatus). Using
  // ping_status here previously flipped the badge to "offline" for any
  // camera on a remote NAT/subnet the worker can't ICMP, even when the
  // stream was serving fine — which was the user-reported bug.
  isOnline: Boolean(c.curl_status),
  streamConnected: Boolean(c.curl_status),
  // Prefer the health-check-specific timestamps over the row's overall
  // updated_at (which can lag or race with unrelated writes). Field
  // names on this endpoint are `curl_updated` / `ping_updated`, NOT
  // `..._at` — /manage/solution/camera/list returns the raw model
  // shape, unlike /cctv/... which normalizes.
  lastUpdated:
    c.curl_updated ?? c.curl_updated_at ?? c.ping_updated ?? c.updated_at ?? c.created_at ?? null,
})

const mapSolution = (
  s: APIResponseSolution,
  cameras: Equipment[] = [],
): TaskType => ({
  id: s.id,
  kind: s.solution_type?.solution_name_atlas ?? s.solution_type?.solution_name ?? 'Unknown',
  kindId: (s.solution_type_id ?? 1) as TaskKindId,
  solutionName: s.solution_name,
  sta: s.sta ?? null,
  ipAddress: s.ip_address ?? null,
  ztIpAddress: s.zt_ip_address ?? null,
  anydesk: s.anydesk ?? null,
  remarks: s.remarks ?? null,
  equipment: cameras,
})

const mapRoutes = (roadSolutions: APIResponseRoadSolution[] = []): RouteDetail[] =>
  roadSolutions.map((r) => ({
    projectRoadId: r.project_road_id,
    roadId: r.road_id,
    code: r.road?.road_code ?? `#${r.road_id}`,
    name: r.road?.road_name ?? null,
    points: (r.solution_locations ?? []).map((sl) => ({
      id: sl.solution_location_id,
      name: sl.location_name,
    })),
  }))

// Warranty status derived client-side from the project row. Mirrors
// StatusBadge in overall/components — kept locally so the detail page
// doesn't cross-import a sibling feature's helper.
const derivedWarrantyStatus = (isWarranty?: boolean): ProjectDetail['warrantyStatus'] =>
  isWarranty ? 'in-warranty' : 'expired'

// ─── Context contract ─────────────────────────────────────────────────────

export interface ContextProps {
  project: ProjectDetail
  isLoading: boolean
  isError: boolean
  errorMessage: string | null

  activeRouteId: number | null
  activePointId: number | null
  setActiveRouteId: (id: number) => void
  setActivePointId: (id: number) => void

  activeRoute: RouteDetail | null
  activePoint: InstallPoint | null

  /** Task types at the active installation point. Empty while loading. */
  activePointTaskTypes: TaskType[]
  taskTypesLoading: boolean
  /** CCTV / VMS cameras at the active installation point. */
  activePointCameras: Equipment[]
  camerasLoading: boolean

  /** Master list of solution types (for the "add task type" modal). */
  solutionTypes: { id: SolutionTypeID; label: string; solutionName: string }[]

  addPoint: (projectRoadId: number, name: string) => Promise<void>
  updatePoint: (solutionLocationId: number, name: string) => Promise<void>
  removePoint: (solutionLocationId: number) => Promise<void>
  removeRoute: (projectRoadId: number) => Promise<void>

  addTaskType: (payload: APIRequestCreateSolution) => Promise<void>
  removeTaskType: (solutionId: number) => Promise<void>

  attachCountingCameras: (solutionId: number, cameraIds: string[]) => Promise<void>
  attachAnalyticCameras: (solutionId: number, cameraIds: string[]) => Promise<void>
  attachCrosswalkCameras: (solutionId: number, cameraIds: string[]) => Promise<void>
  attachWimCameras: (solutionId: number, cameraIds: string[]) => Promise<void>
  attachTrafficCameras: (
    solutionId: number,
    cameras: { camera_id: string; phase: number; camera_type: string }[],
  ) => Promise<void>
  createVMSSolution: (payload: APIRequestCreateVMSSolution) => Promise<void>
  appendVmsCameras: (vmsId: number, cameraIds: string[]) => Promise<void>

  isSubmitting: boolean
}

export const ProjectDetailContext = createContext<ContextProps | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────

export interface PageProviderProps {
  children: React.ReactNode
  projectId: string
}

export const ProjectDetailProvider = ({ children, projectId }: PageProviderProps) => {
  // ─── Reads ────────────────────────────────────────────────────────────
  const numericProjectId = useMemo(() => {
    const n = Number(projectId)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [projectId])

  const projectQuery = useProjectDetail(numericProjectId)
  const routesQuery = useRoadSolutions(numericProjectId)
  const solutionTypesQuery = useSolutionTypes()

  // ─── Active route / point ─────────────────────────────────────────────
  const routes = useMemo(() => mapRoutes(routesQuery.data ?? []), [routesQuery.data])

  const [activeRouteId, setActiveRouteId] = useState<number | null>(null)
  const [activePointId, setActivePointId] = useState<number | null>(null)

  // Whenever the route tree resolves or the active route disappears (e.g.
  // was deleted), fall back to the first available route + its first point.
  useEffect(() => {
    if (routes.length === 0) {
      setActiveRouteId(null)
      setActivePointId(null)
      return
    }
    const currentRoute = routes.find((r) => r.projectRoadId === activeRouteId)
    if (!currentRoute) {
      setActiveRouteId(routes[0].projectRoadId)
      setActivePointId(routes[0].points[0]?.id ?? null)
      return
    }
    if (activePointId != null && !currentRoute.points.some((p) => p.id === activePointId)) {
      setActivePointId(currentRoute.points[0]?.id ?? null)
    } else if (activePointId == null && currentRoute.points.length > 0) {
      setActivePointId(currentRoute.points[0].id)
    }
  }, [routes, activeRouteId, activePointId])

  const activeRoute = useMemo(
    () => routes.find((r) => r.projectRoadId === activeRouteId) ?? null,
    [routes, activeRouteId],
  )
  const activePoint = useMemo(
    () => activeRoute?.points.find((p) => p.id === activePointId) ?? null,
    [activeRoute, activePointId],
  )

  // ─── Task types + cameras for the active point (lazy) ─────────────────
  const solutionsQuery = useSolutions(activePointId)
  const camerasQuery = useSolutionCameras(activePointId)

  const cameraById = useMemo(() => {
    const m = new Map<string, Equipment>()
    ;(camerasQuery.data ?? []).forEach((c) => m.set(c.id, mapCamera(c)))
    return m
  }, [camerasQuery.data])

  const activePointTaskTypes = useMemo<TaskType[]>(() => {
    const solutions = solutionsQuery.data ?? []
    return solutions.map((s) => mapSolution(s))
  }, [solutionsQuery.data])

  const activePointCameras = useMemo(
    () => Array.from(cameraById.values()),
    [cameraById],
  )

  // ─── Project shape for UI ─────────────────────────────────────────────
  const project = useMemo<ProjectDetail>(() => {
    const p = projectQuery.data
    return {
      id: numericProjectId ?? 0,
      code: p?.project_no ?? '',
      name: p?.project_name ?? '',
      warrantyStatus: derivedWarrantyStatus(p?.is_warranty),
      routes: routes.map((r) => ({
        ...r,
        points: r.points.map((pt) =>
          pt.id === activePointId
            ? { ...pt, taskTypes: activePointTaskTypes }
            : pt,
        ),
      })),
    }
  }, [projectQuery.data, numericProjectId, routes, activePointId, activePointTaskTypes])

  // ─── Solution-type master list for the AddTaskType modal ──────────────
  const solutionTypes = useMemo(
    () =>
      (solutionTypesQuery.data ?? []).map((t) => ({
        id: t.id as SolutionTypeID,
        label: t.solution_name_atlas || t.solution_name,
        solutionName: t.solution_name,
      })),
    [solutionTypesQuery.data],
  )

  // ─── Mutations ────────────────────────────────────────────────────────
  const createRoadSolution = useCreateRoadSolution()
  const updateSolutionLocation = useUpdateSolutionLocation()
  const deleteSolutionLocation = useDeleteSolutionLocation()
  const deleteProjectRoad = useDeleteProjectRoad()
  const createSolution = useCreateSolution()
  const deleteSolution = useDeleteSolution()
  const attachCounting = useAttachCountingCameras()
  const attachAnalytic = useAttachAnalyticCameras()
  const attachCrosswalk = useAttachCrosswalkCameras()
  const attachWim = useAttachWimCameras()
  const attachTraffic = useAttachTrafficCameras()
  const createVMS = useCreateVMSSolution()
  const appendVms = useAppendVmsCameras()

  const wrapMutation = useCallback(
    async <T,>(
      run: () => Promise<T>,
      successMsg: string,
      errorMsg: string,
    ): Promise<T> => {
      try {
        const out = await run()
        message.success(successMsg)
        return out
      } catch (err) {
        message.error(errText(err, errorMsg))
        throw err
      }
    },
    [],
  )

  const addPoint = useCallback(
    async (projectRoadId: number, name: string) => {
      await wrapMutation(
        () => createRoadSolution.mutateAsync({ project_road_id: projectRoadId, location_name: name }),
        'เพิ่มจุดติดตั้งสำเร็จ',
        'เพิ่มจุดติดตั้งไม่สำเร็จ',
      )
    },
    [createRoadSolution, wrapMutation],
  )

  const updatePoint = useCallback(
    async (solutionLocationId: number, name: string) => {
      await wrapMutation(
        () =>
          updateSolutionLocation.mutateAsync({
            id: solutionLocationId,
            data: { location_name: name },
          }),
        'แก้ไขจุดติดตั้งสำเร็จ',
        'แก้ไขจุดติดตั้งไม่สำเร็จ',
      )
    },
    [updateSolutionLocation, wrapMutation],
  )

  const removePoint = useCallback(
    async (solutionLocationId: number) => {
      await wrapMutation(
        () => deleteSolutionLocation.mutateAsync(solutionLocationId),
        'ลบจุดติดตั้งสำเร็จ',
        'ลบจุดติดตั้งไม่สำเร็จ',
      )
    },
    [deleteSolutionLocation, wrapMutation],
  )

  const removeRoute = useCallback(
    async (projectRoadId: number) => {
      await wrapMutation(
        () => deleteProjectRoad.mutateAsync(projectRoadId),
        'ลบสายทางออกจากโครงการสำเร็จ',
        'ลบสายทางออกจากโครงการไม่สำเร็จ',
      )
    },
    [deleteProjectRoad, wrapMutation],
  )

  const addTaskType = useCallback(
    async (payload: APIRequestCreateSolution) => {
      await wrapMutation(
        () => createSolution.mutateAsync(payload),
        'เพิ่มประเภทงานสำเร็จ',
        'เพิ่มประเภทงานไม่สำเร็จ',
      )
    },
    [createSolution, wrapMutation],
  )

  const removeTaskType = useCallback(
    async (solutionId: number) => {
      await wrapMutation(
        () => deleteSolution.mutateAsync(solutionId),
        'ลบประเภทงานสำเร็จ',
        'ลบประเภทงานไม่สำเร็จ',
      )
    },
    [deleteSolution, wrapMutation],
  )

  const attachCountingCameras = useCallback(
    async (solutionId: number, cameraIds: string[]) => {
      await wrapMutation(
        () => attachCounting.mutateAsync({ solution_id: solutionId, camera_id: cameraIds }),
        'บันทึกอุปกรณ์สำเร็จ',
        'บันทึกอุปกรณ์ไม่สำเร็จ',
      )
    },
    [attachCounting, wrapMutation],
  )

  const attachAnalyticCameras = useCallback(
    async (solutionId: number, cameraIds: string[]) => {
      await wrapMutation(
        () => attachAnalytic.mutateAsync({ solution_id: solutionId, camera_id: cameraIds }),
        'บันทึกอุปกรณ์สำเร็จ',
        'บันทึกอุปกรณ์ไม่สำเร็จ',
      )
    },
    [attachAnalytic, wrapMutation],
  )

  const attachCrosswalkCameras = useCallback(
    async (solutionId: number, cameraIds: string[]) => {
      await wrapMutation(
        () => attachCrosswalk.mutateAsync({ solution_id: solutionId, camera_id: cameraIds }),
        'บันทึกอุปกรณ์สำเร็จ',
        'บันทึกอุปกรณ์ไม่สำเร็จ',
      )
    },
    [attachCrosswalk, wrapMutation],
  )

  const attachWimCameras = useCallback(
    async (solutionId: number, cameraIds: string[]) => {
      await wrapMutation(
        () => attachWim.mutateAsync({ solution_id: solutionId, camera_id: cameraIds }),
        'บันทึกอุปกรณ์สำเร็จ',
        'บันทึกอุปกรณ์ไม่สำเร็จ',
      )
    },
    [attachWim, wrapMutation],
  )

  const attachTrafficCameras = useCallback(
    async (
      solutionId: number,
      cameras: { camera_id: string; phase: number; camera_type: string }[],
    ) => {
      await wrapMutation(
        () => attachTraffic.mutateAsync({ solution_id: solutionId, cameras }),
        'บันทึกอุปกรณ์สำเร็จ',
        'บันทึกอุปกรณ์ไม่สำเร็จ',
      )
    },
    [attachTraffic, wrapMutation],
  )

  const createVMSSolution = useCallback(
    async (payload: APIRequestCreateVMSSolution) => {
      await wrapMutation(
        () => createVMS.mutateAsync(payload),
        'สร้างอุปกรณ์ VMS สำเร็จ',
        'สร้างอุปกรณ์ VMS ไม่สำเร็จ',
      )
    },
    [createVMS, wrapMutation],
  )

  const appendVmsCameras = useCallback(
    async (vmsId: number, cameraIds: string[]) => {
      await wrapMutation(
        () => appendVms.mutateAsync({ vms_id: vmsId, camera_id: cameraIds }),
        'เพิ่มกล้อง VMS สำเร็จ',
        'เพิ่มกล้อง VMS ไม่สำเร็จ',
      )
    },
    [appendVms, wrapMutation],
  )

  const isLoading = projectQuery.isLoading || routesQuery.isLoading
  const isError = projectQuery.isError || routesQuery.isError
  const errorMessage = projectQuery.isError
    ? errText(projectQuery.error, 'ไม่สามารถโหลดข้อมูลโครงการได้')
    : routesQuery.isError
      ? errText(routesQuery.error, 'ไม่สามารถโหลดข้อมูลสายทางได้')
      : null

  const isSubmitting =
    createRoadSolution.isPending ||
    updateSolutionLocation.isPending ||
    deleteSolutionLocation.isPending ||
    deleteProjectRoad.isPending ||
    createSolution.isPending ||
    deleteSolution.isPending ||
    attachCounting.isPending ||
    attachAnalytic.isPending ||
    attachCrosswalk.isPending ||
    attachWim.isPending ||
    attachTraffic.isPending ||
    createVMS.isPending ||
    appendVms.isPending

  const value = useMemo<ContextProps>(
    () => ({
      project,
      isLoading,
      isError,
      errorMessage,
      activeRouteId,
      activePointId,
      setActiveRouteId: (id: number) => {
        setActiveRouteId(id)
        const target = routes.find((r) => r.projectRoadId === id)
        setActivePointId(target?.points[0]?.id ?? null)
      },
      setActivePointId,
      activeRoute,
      activePoint,
      activePointTaskTypes,
      taskTypesLoading: solutionsQuery.isLoading,
      activePointCameras,
      camerasLoading: camerasQuery.isLoading,
      solutionTypes,
      addPoint,
      updatePoint,
      removePoint,
      removeRoute,
      addTaskType,
      removeTaskType,
      attachCountingCameras,
      attachAnalyticCameras,
      attachCrosswalkCameras,
      attachWimCameras,
      attachTrafficCameras,
      createVMSSolution,
      appendVmsCameras,
      isSubmitting,
    }),
    [
      project,
      isLoading,
      isError,
      errorMessage,
      activeRouteId,
      activePointId,
      routes,
      activeRoute,
      activePoint,
      activePointTaskTypes,
      solutionsQuery.isLoading,
      activePointCameras,
      camerasQuery.isLoading,
      solutionTypes,
      addPoint,
      updatePoint,
      removePoint,
      removeRoute,
      addTaskType,
      removeTaskType,
      attachCountingCameras,
      attachAnalyticCameras,
      attachCrosswalkCameras,
      attachWimCameras,
      attachTrafficCameras,
      createVMSSolution,
      appendVmsCameras,
      isSubmitting,
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
