"use client"
import { useMemo } from 'react'
import { useDeptId } from '@/hooks/useDeptId'
import { isValidLightingDeptId, useLightingCentralList } from '@/hooks/queries/lighting'
import {
  mapCentralListToProjects,
  type TrafficLightingProject,
} from '../overall/data/trafficLightingProjects'
import { buildTrafficLightingProject } from './buildTrafficLightingProject'
import { resolveLightingSolutionId } from './lightingDetailNavigation'

/** Resolve project metadata from the API so detail pages remain deep-linkable. */
export interface LightingProjectQueryResult {
  project: TrafficLightingProject
  /** This URL's department list holds the point. Not so for dept 0 without
   *  scope=all, whose plain list is empty — the page then has to read the
   *  point some other way. */
  found: boolean
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
    // An IMEI-less "<solution>-<n>" id's `n` is its place in the list the link
    // came from — another department's list numbers it differently — so it
    // is matched by its solution too.
    const routeSolutionId = resolveLightingSolutionId(routeId)
    return projects.find((project) => (
      project.id === routeId ||
      (!!imei && project.imei === imei) ||
      (project.solutionId != null && String(project.solutionId) === routeId)
    )) ?? (routeSolutionId == null
      ? undefined
      : projects.find((project) => project.solutionId === routeSolutionId))
  }, [centralListQuery.data, imei, routeId])

  const project = useMemo(
    () => buildTrafficLightingProject(routeId, apiProject, equipmentType),
    [apiProject, equipmentType, routeId],
  )

  return {
    project,
    found: apiProject != null,
    isLoading: isDepartmentValid && centralListQuery.isLoading,
    isError: !isDepartmentValid || centralListQuery.isError,
    refetch: () => { void centralListQuery.refetch() },
  }
}
