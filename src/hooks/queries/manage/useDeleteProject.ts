import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProjectAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** DELETE /manage/project/{id}. Invalidates the list + drops the detail
 *  cache for the deleted id so a stale row can't be revived from cache. */
export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProjectAPI(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
      qc.removeQueries({ queryKey: manageKeys.projects.detail(id) })
    },
  })
}
