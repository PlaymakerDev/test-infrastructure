import { useQuery } from '@tanstack/react-query'
import { getProjectContractorsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/project/contractor — bare `Contractor[]`, no envelope. Powers
 *  the contractor dropdown inside the project create/edit modal. Kept
 *  separate from `useContractorsList` because this endpoint may return a
 *  narrower slice (project-eligible contractors only). */
export const useProjectContractors = () =>
  useQuery({
    queryKey: manageKeys.dropdowns.contractors(),
    queryFn: () => getProjectContractorsAPI().then((r) => r.data),
  })
