import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContractorAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** DELETE /manage/contractor/{user_id}. Also invalidates the project list
 *  since a deleted contractor may render as a broken join on project rows. */
export const useDeleteContractor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContractorAPI(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.contractors.all })
      qc.invalidateQueries({ queryKey: manageKeys.dropdowns.contractors() })
      qc.invalidateQueries({ queryKey: manageKeys.projects.all })
    },
  })
}
