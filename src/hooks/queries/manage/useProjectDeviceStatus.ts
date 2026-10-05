import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getProjectDeviceStatusAPI,
  getProjectDeviceStatusListAPI,
} from '@/services/routes/ManageService'
import type { APIRequestProjectDeviceStatusList } from '@/types/manage/device-status-api'
import { manageKeys } from './queryKeys'

/** GET /manage/project/device-status — one page of projects with their
 *  camera / VMS / lighting online-offline counts. Keeps the previous page on
 *  screen while the next one loads. */
export const useProjectDeviceStatusList = (
  params: APIRequestProjectDeviceStatusList,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.list(params),
    queryFn: () => getProjectDeviceStatusListAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })

/** GET /manage/project/device-status/{id} — the project's CCTV cameras grouped
 *  by road + sta. Disabled until a project is picked. */
export const useProjectDeviceStatus = (projectId: number | null | undefined) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.detail(projectId ?? 0),
    queryFn: () => getProjectDeviceStatusAPI(projectId as number).then((r) => r.data),
    enabled: projectId != null,
  })
