import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGeneralUserPasswordAPI } from '@/services/routes/ManageService'
import type { APIRequestUpdateGeneralUserPassword } from '@/types/manage/general-user-api'
import { manageKeys } from './queryKeys'

/** PATCH /manage/general_user/{user_id}/password. Admin-side reset — the
 *  list is invalidated to refresh any "last updated" metadata even though
 *  the password itself is never re-fetched. */
export const useUpdateUserPassword = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: APIRequestUpdateGeneralUserPassword
    }) => updateGeneralUserPasswordAPI(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.users.all })
    },
  })
}
