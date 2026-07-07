import { useQuery } from '@tanstack/react-query'
import { getDepartmentsAPI } from '@/services/routes/ManageService'
import { manageKeys } from './queryKeys'

/** GET /manage/departments — bare array, no envelope. Powers the
 *  "ผู้ว่าจ้าง" dropdown and joins the department_short_name label into the
 *  Project / Road tables client-side. */
export const useDepartments = () =>
  useQuery({
    queryKey: manageKeys.dropdowns.departments(),
    queryFn: () => getDepartmentsAPI().then((r) => r.data),
  })
