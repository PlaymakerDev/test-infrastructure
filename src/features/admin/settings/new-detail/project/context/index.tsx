"use client"
import { message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSolutionLocationAPI, getRoadSolutionAPI, postRoadSolutionAPI } from '@/services/routes/ProjectDetailService'
import { Road, RoadSolutionList } from '@/types/manage/project-detail-api'
import { createContext, useCallback, useContext, useState } from 'react'

export interface ContextProps {
  id: string | string[] | undefined
  roadSolution: RoadSolutionList
  setRoadSolution: (roadSolution: RoadSolutionList) => void
  onCreate: () => void
  isCreating: boolean
  /** `options.onSuccess` runs once the delete AND the follow-up
   *  `refreshRoadSolution` (tabs list + active-tab fallback) have finished —
   *  it is a `mutate`-level callback, which TanStack fires after the
   *  hook-level async `onSuccess`. Not called on error. */
  onDelete: (id: number | string, options?: { onSuccess?: () => void }) => void
  isDeleting: boolean
  /** Re-fetches the road's solution list and syncs `roadSolution` +
   *  TitleSection's query cache — reused by `onCreate`/`onDelete` and by
   *  any other write (e.g. renaming a point) that needs the same tabs
   *  data to reflect the change afterward. Returns the refreshed road so
   *  callers can pick the point to activate off the up-to-date list. */
  refreshRoadSolution: (projectRoadId: number) => Promise<RoadSolutionList | undefined>
  /** The tab (`solution_location_id`, as a string) MainContent should show
   *  as active. Owned here — not locally in MainContent — because
   *  `onCreate`/`onDelete` are the ones that know which tab should become
   *  active once their mutation lands. */
  activeLocationId: string | undefined
  setActiveLocationId: (id: string | undefined) => void
}

// Mirrors overall/context's error helper — no shared export exists yet.
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


export interface PageProviderProps {
  children: React.ReactNode
  id: string | string[] | undefined
}

export const ProjectContext = createContext<ContextProps | null>(null)

export const INIT_ROAD: Road = {
  id: 0,
  road_name: '',
  road_code: '',
  subdistrict: '',
  district: '',
  province: '',
  department_id: 0,
  start_sta: '',
  end_sta: '',
  distance: 0,
  created_at: '',
  created_by: '',
}

export const INIT_ROAD_SOLUTION: RoadSolutionList = {
  project_road_id: 0,
  project_id: 0,
  road_id: 0,
  solution_locations: [],
  road: INIT_ROAD
}

export const ProjectProvider = (props: PageProviderProps) => {
  const { children, id } = props
  const [roadSolution, setRoadSolution] = useState<RoadSolutionList>({ ...INIT_ROAD_SOLUTION })
  const [activeLocationId, setActiveLocationId] = useState<string | undefined>(undefined)
  const queryClient = useQueryClient()

  // Shared by both mutations below. Fetch directly rather than through
  // `queryClient.fetchQuery` on TitleSection's ['roadSolution', id] key:
  // sharing that key with a queryFn returning a different shape (`.data`
  // unwrapped) than TitleSection's (the raw AxiosResponse) let query-dedup
  // hand back the wrong shape, crashing on `.find`. Invalidate afterwards
  // so TitleSection's own query still refreshes.
  const refreshRoadSolution = useCallback(async (projectRoadId: number) => {
    try {
      const res = await getRoadSolutionAPI({ project_id: String(id) })
      const updated = res.data.find((item) => item.project_road_id === projectRoadId)
      if (updated) setRoadSolution(updated)
      return updated
    } catch {
      // TitleSection's invalidated query below still catches it up.
      return undefined
    } finally {
      queryClient.invalidateQueries({ queryKey: ['roadSolution', id] })
    }
  }, [id, queryClient])

  const createRoadSolution = useMutation({
    mutationFn: postRoadSolutionAPI,
    onSuccess: async (_res, variables) => {
      message.success('เพิ่มจุดติดตั้งสำเร็จ')
      const updated = await refreshRoadSolution(variables.project_road_id)
      // Match by name rather than assuming the new point lands last in the
      // array — robust regardless of how the backend orders the list.
      const created = updated?.solution_locations.find(
        (loc) => loc.location_name === variables.location_name,
      )
      setActiveLocationId(created ? String(created.solution_location_id) : undefined)
    },
    onError: (err) => {
      message.error(errText(err, 'เพิ่มจุดติดตั้งไม่สำเร็จ'))
    },
  })

  const deleteSolutionLocation = useMutation({
    mutationFn: ({ id: solutionLocationId }: { id: number | string; fallbackId?: number }) =>
      deleteSolutionLocationAPI(solutionLocationId),
    onSuccess: async (_res, variables) => {
      message.success('ลบจุดติดตั้งสำเร็จ')
      const updated = await refreshRoadSolution(roadSolution.project_road_id)
      // "The latest tab among the ones before the deleted one" — the point
      // that immediately preceded it in the pre-delete order; falls back to
      // the new first tab when the deleted one was already first.
      const fallback =
        updated?.solution_locations.find((loc) => loc.solution_location_id === variables.fallbackId) ??
        updated?.solution_locations[0]
      setActiveLocationId(fallback ? String(fallback.solution_location_id) : undefined)
    },
    onError: (err) => {
      message.error(errText(err, 'ลบจุดติดตั้งไม่สำเร็จ'))
    },
  })

  const onCreate = useCallback(() => {
    if (!roadSolution.project_road_id || createRoadSolution.isPending) return
    // Derive the next number from the highest existing "จุดติดตั้งที่ N"
    // suffix rather than `solution_locations.length + 1` — the array can be
    // shorter than the highest number used (e.g. a deleted point), which
    // would otherwise mint a name that collides with a still-existing one.
    const nextIndex = roadSolution.solution_locations.reduce((max, item) => {
      const match = /^จุดติดตั้งที่ (\d+)$/.exec(item.location_name)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0) + 1
    createRoadSolution.mutate({
      project_road_id: roadSolution.project_road_id,
      location_name: `จุดติดตั้งที่ ${nextIndex}`,
    })
  }, [roadSolution, createRoadSolution])

  const onDelete = useCallback((solutionLocationId: number | string, options?: { onSuccess?: () => void }) => {
    if (deleteSolutionLocation.isPending) return
    const list = roadSolution.solution_locations
    const idx = list.findIndex((loc) => String(loc.solution_location_id) === String(solutionLocationId))
    const fallbackId = idx > 0 ? list[idx - 1].solution_location_id : undefined
    deleteSolutionLocation.mutate({ id: solutionLocationId, fallbackId }, options)
  }, [roadSolution, deleteSolutionLocation])

  return (
    <ProjectContext.Provider
      value={{
        id,
        roadSolution,
        setRoadSolution,
        onCreate,
        isCreating: createRoadSolution.isPending,
        onDelete,
        isDeleting: deleteSolutionLocation.isPending,
        refreshRoadSolution,
        activeLocationId,
        setActiveLocationId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
