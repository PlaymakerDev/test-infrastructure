import { useQuery } from '@tanstack/react-query'
import { getLPRTotalAPI } from '@/services/routes/NewLPRService'
import type { APIRequestLPRTotal } from '@/types/lpr/new-lpr-api'
import { lprKeys } from './queryKeys'

/** GET /lpr/departments/{id}/overview/central/totals — install-point totals
 *  (solution total/online/offline + warranty) for one department. The backend
 *  scopes it (`scope=all` aggregates a สำนัก's ขทช.), unlike `/lpr/points`
 *  which returns every point nationwide. */
export const useLPRTotals = (
  deptId: string | number | undefined,
  params: APIRequestLPRTotal = {},
) =>
  useQuery({
    queryKey: lprKeys.totals.list(String(deptId ?? ''), params),
    queryFn: () => getLPRTotalAPI(deptId!, params).then((r) => r.data),
    enabled: deptId != null && deptId !== '',
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
