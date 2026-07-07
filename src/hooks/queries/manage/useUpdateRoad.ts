import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRoadAPI } from '@/services/routes/ManageService'
import type { APIRequestRoad } from '@/types/manage/road-api'
import { manageKeys } from './queryKeys'

/** PUT /manage/roads/{id}. Also invalidates project queries because a road's
 *  name/code is linked into project_road rows and shown as a project detail. */
export const useUpdateRoad = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: APIRequestRoad }) =>
      updateRoadAPI(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roads.all })
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
    },
  })
}
