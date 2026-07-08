import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRoadAPI } from '@/services/routes/ManageService'
import type { APIRequestRoad } from '@/types/manage/road-api'
import { manageKeys } from './queryKeys'

/** POST /manage/roads. */
export const useCreateRoad = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: APIRequestRoad) => createRoadAPI(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manageKeys.roads.all })
    },
  })
}
