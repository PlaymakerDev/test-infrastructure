import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContractorAPI } from '@/services/routes/ManageService'
import type { APIRequestRegisterContractor } from '@/types/manage/contractor-api'
import { manageKeys } from './queryKeys'

/** POST /manage/contractor. Also invalidates the project-contractor
 *  dropdown since new contractors become selectable in the project modal. */
export const useCreateContractor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestRegisterContractor) =>
      createContractorAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.contractors.all })
      qc.invalidateQueries({ queryKey: manageKeys.dropdowns.contractors() })
    },
  })
}
