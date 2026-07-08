import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRoadAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** DELETE /manage/roads/{id}. */
export const useDeleteRoad = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRoadAPI(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roads.all })
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
    },
  })
}
