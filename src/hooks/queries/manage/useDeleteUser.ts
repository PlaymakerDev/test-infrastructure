import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGeneralUserAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** DELETE /manage/general_user/{user_id}. */
export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGeneralUserAPI(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.users.all })
    },
  })
}
