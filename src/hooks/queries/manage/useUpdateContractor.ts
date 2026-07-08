import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateContractorAPI } from '@/services/routes/ManageService'
import type { APIRequestUpdateContractor } from '@/types/manage/contractor-api'
import { manageKeys } from './queryKeys'

/** PUT /manage/contractor/{user_id}. Path id is the uuid `user_id`, not a
 *  numeric row id — pass it through verbatim. */
export const useUpdateContractor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: APIRequestUpdateContractor
    }) => updateContractorAPI(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.contractors.all })
      qc.invalidateQueries({ queryKey: manageKeys.dropdowns.contractors() })
    },
  })
}
