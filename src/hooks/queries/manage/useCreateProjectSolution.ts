import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postSolutionAPI } from '@/services/routes/ProjectDetailService'
import type { APIRequestCreateSolution } from '@/types/manage/project-detail-api'
import { manageKeys } from './queryKeys'

/** POST /manage/solution — new-detail project page variant (typed by
 *  `project-detail-api`, unlike `useCreateSolution` in `./solution`, which
 *  wraps SolutionService's stricter `solution-api` types for the same
 *  endpoint). Invalidates every `solutions.*` read — by-location list,
 *  types-at-location counts, cameras-at-location — and returns the promise
 *  so the mutation stays pending until the list has refetched. */
export const useCreateProjectSolution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestCreateSolution) =>
      postSolutionAPI(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: manageKeys.solutions.all }),
  })
}
