// CCTV camera CRUD hooks — /cctv/cameras endpoints, wired for the
// project-detail equipment modal. Kept under manage/ because the settings
// page is the sole caller.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCameraAPI,
  deleteCameraAPI,
  updateCameraAPI,
  type CreateCameraRequest,
  type UpdateCameraRequest,
} from '@/services/routes/CCTVService'
import { cctvDetailKey } from '@/hooks/queries/shared/useCCTVDetail'
import { manageKeys } from './queryKeys'

export const useCreateCamera = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCameraRequest) =>
      createCameraAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.equipments.all })
    },
  })
}

export const useDeleteCamera = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCameraAPI(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.equipments.all })
    },
  })
}

export const useUpdateCamera = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCameraRequest }) =>
      updateCameraAPI(id, data).then((r) => r.data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.equipments.all })
      // The camera's own record — the only place access_url (Public URL)
      // lives. Read by the edit form (useCCTVDetail) and by the Live Stream
      // modal (CCTVModal's inline ['cctv_detail', id] key, AxiosResponse
      // shape); refresh both so neither serves the value from before the
      // save. The edit form re-sends whatever it was seeded with, so a stale
      // copy there would quietly revert the change on the next edit.
      qc.invalidateQueries({ queryKey: cctvDetailKey(id) })
      qc.invalidateQueries({ queryKey: ['cctv_detail', String(id)] })
    },
  })
}
