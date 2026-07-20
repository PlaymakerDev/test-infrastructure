import { useQuery } from '@tanstack/react-query'
import { getProjectByCaseNoAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/project/case/{case_no}. Disabled until `caseNo` is provided —
 *  safe to mount from a case-detail modal before a row is selected. */
export const useProjectByCaseNo = (caseNo: string | null | undefined) =>
  useQuery({
    queryKey: manageKeys.projects.byCaseNo(caseNo ?? ''),
    queryFn: () => getProjectByCaseNoAPI(caseNo as string).then((r) => r.data),
    enabled: !!caseNo,
  })
