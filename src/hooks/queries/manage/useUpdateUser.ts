import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGeneralUserAPI } from '@/services/routes/ManageService'
import type { APIRequestUpdateGeneralUser } from '@/types/manage/general-user-api'
import { manageKeys } from './queryKeys'

/** PUT /manage/general_user/{user_id}. Path id is the uuid. */
export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: APIRequestUpdateGeneralUser
    }) => updateGeneralUserAPI(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.users.all })
    },
  })
}
