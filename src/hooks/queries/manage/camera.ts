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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
      qc.invalidateQueries({ queryKey: manageKeys.equipments.all })
    },
  })
}
