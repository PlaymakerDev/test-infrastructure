import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGeneralUserAPI } from '@/services/routes/ManageService'
import type { APIRequestRegisterGeneralUser } from '@/types/manage/general-user-api'
import { manageKeys } from './queryKeys'

/** POST /manage/general_user. */
export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestRegisterGeneralUser) =>
      createGeneralUserAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.users.all })
    },
  })
}
