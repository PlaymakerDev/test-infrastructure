import { useAppSelector } from '@/stores/hooks'
import { useUserRole } from '@/hooks/useUserRole'
import { isAdmin } from '@/utils/isAdmin'

/** Who may add or remove a project's สายทาง, and add its first จุดติดตั้ง, from
 *  this page: every role but 'user'. The backend answers role user 403 on
 *  PUT /manage/project and POST / DELETE /manage/solution/road_solution
 *  (checked 2026-09-29; the user confirmed that is right). `isAdmin(info)`
 *  covers username 'admin' and contractors; `useUserRole` adds the role-admin
 *  accounts (e.g. drr, drr-10). */
export const useCanEditProjectRoads = (): boolean => {
  const { info } = useAppSelector((state) => state.auth)
  const { isAdmin: isAdminRole } = useUserRole()
  return isAdmin(info) || isAdminRole
}
