"use client"
import { useMemo } from 'react'
import { useDeptId } from '@/hooks/useDeptId'
import { isValidLightingDeptId, useLightingCentralList } from '@/hooks/queries/lighting'
import {
  mapCentralListToProjects,
  type TrafficLightingProject,
} from '../overall/data/trafficLightingProjects'
import { buildTrafficLightingProject } from './buildTrafficLightingProject'

/** Resolve project metadata from the API so detail pages remain deep-linkable. */
export interface LightingProjectQueryResult {
  project: TrafficLightingProject
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export const useLightingProject = (
  routeId: string,
  imei: string,
  equipmentType?: string | null,
): LightingProjectQueryResult => {
  const deptId = useDeptId()
  const isDepartmentValid = isValidLightingDeptId(deptId)
  const centralListQuery = useLightingCentralList(deptId)

  const apiProject = useMemo(() => {
    const projects = mapCentralListToProjects(centralListQuery.data ?? [])
    return projects.find((project) => (
      project.id === routeId ||
      (!!imei && project.imei === imei) ||
      (project.solutionId != null && String(project.solutionId) === routeId)
    ))
  }, [centralListQuery.data, imei, routeId])

  const project = useMemo(
    () => buildTrafficLightingProject(routeId, apiProject, equipmentType),
    [apiProject, equipmentType, routeId],
  )

  return {
    project,
    isLoading: isDepartmentValid && centralListQuery.isLoading,
    isError: !isDepartmentValid || centralListQuery.isError,
    refetch: () => { void centralListQuery.refetch() },
  }
}
