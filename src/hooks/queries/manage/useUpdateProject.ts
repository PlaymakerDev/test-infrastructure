import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProjectAPI } from '@/services/routes/ManageService'
import type { APIRequestProjectUpdate } from '@/types/manage/project-api'
import { manageKeys } from './queryKeys'

/** PUT /manage/project — body carries the numeric `id`; there is no path
 *  parameter. Invalidates both the list and this project's detail cache. */
export const useUpdateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestProjectUpdate) =>
      updateProjectAPI(body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
      qc.invalidateQueries({
        queryKey: manageKeys.projects.detail(variables.id),
      })
    },
  })
}
