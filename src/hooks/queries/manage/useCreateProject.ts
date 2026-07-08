import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProjectAPI } from '@/services/routes/ManageService'
import type { APIRequestProject } from '@/types/manage/project-api'
import { manageKeys } from './queryKeys'

/** POST /manage/project — on success invalidates the project list so the
 *  new row shows up without a manual refetch. */
export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestProject) =>
      createProjectAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
    },
  })
}
