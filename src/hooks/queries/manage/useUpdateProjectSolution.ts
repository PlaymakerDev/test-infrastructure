import { useMutation, useQueryClient } from '@tanstack/react-query'
import { putSolutionAPI } from '@/services/routes/ProjectDetailService'
import type { APIRequestUpdateSolution } from '@/types/manage/project-detail-api'
import { manageKeys } from './queryKeys'

/** PUT /manage/solution/{id} — new-detail project page variant. The body has
 *  no `solution_type_id` / `solution_location_id`: a solution's type and
 *  point are fixed once created. Invalidating `solutions.all` reaches the
 *  by-location list (prefix match) and this solution's detail; the promise
 *  is returned so the mutation stays pending until the table has refetched. */
export const useUpdateProjectSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: APIRequestUpdateSolution }) =>
      putSolutionAPI(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: manageKeys.solutions.all }),
  })
}
