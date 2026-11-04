import { useQuery } from '@tanstack/react-query'
import { manageKeys } from '@/hooks/queries/manage'
import { fetchAllPages } from '@/features/admin/settings/overall/utils/fetchAllPages'
import { getProjectDeviceSummaryListAPI } from '@/services/routes/ManageService'
import { isPlaceholder } from '../data/allContractors'

/** รวมผู้รับจ้าง's projects — every contractor's under the warranty filter,
 *  all pages, less the placeholders the report leaves out. For the
 *  export dialog's count; read while `enabled`. */
export const useAllContractorsProjects = (isWarranty: boolean | undefined, enabled: boolean) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.summaryRows('', isWarranty),
    queryFn: () =>
      fetchAllPages((page, limit) => getProjectDeviceSummaryListAPI({ is_warranty: isWarranty, page, limit }).then((r) => r.data)),
    select: (rows) => rows.filter((row) => !isPlaceholder(row)),
    enabled,
  })
