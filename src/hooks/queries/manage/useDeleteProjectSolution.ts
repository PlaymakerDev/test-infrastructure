import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSolutionAPI } from '@/services/routes/ProjectDetailService'
import { manageKeys } from './queryKeys'

/** DELETE /manage/solution/{id} — new-detail project page variant (wraps
 *  ProjectDetailService's fn; `useDeleteSolution` in `./solution` wraps
 *  SolutionService's). Drops this solution's cached detail, then
 *  invalidates every `solutions.*` read: the by-location list that
 *  SolutionContent renders refetches (a point left with no solution falls
 *  back to EmptySolutionContent on its own). The promise is returned so the
 *  mutation stays pending until that refetch has finished. */
export const useDeleteProjectSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSolutionAPI(id).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: manageKeys.solutions.detail(id) })
      return qc.invalidateQueries({ queryKey: manageKeys.solutions.all })
    },
  })
}
