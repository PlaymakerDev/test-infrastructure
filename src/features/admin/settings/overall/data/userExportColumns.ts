import { ROLE } from '@/constants'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { APIResponseGeneralUser } from '@/types/manage/general-user-api'

export interface UserExportRow {
  username: string
  userType: string
  fullName: string
  departmentName: string
  provinceName: string
  roleText: string
}

/** Same field mapping as TableUserData's on-screen renderers (renderIsLDAP /
 *  renderName / renderDpt / renderRole) — keeps the export identical to what
 *  the table shows. */
export const toUserExportRow = (
  row: APIResponseGeneralUser,
  departments?: APIResponseDepartment[],
): UserExportRow => {
  const department = departments?.find((dpt) => Number(dpt.id) === Number(row.department_id))
  return {
    username: row.user?.username || '-',
    userType: row.is_ldap ? 'LDAP' : 'DRR ITS',
    fullName: [row.first_name, row.lastname].filter(Boolean).join(' ') || '-',
    departmentName: department?.department_name || '-',
    provinceName: row.province?.name_th || '-',
    roleText: ROLE[row.role as keyof typeof ROLE]?.text || '-',
  }
}

/** Shared column config for both PDF and Excel exports of the ผู้ใช้งาน
 *  (general user) list. SAME columns, SAME order as TableUserData (minus the
 *  จัดการ action column), plus ลำดับ (mirrors PROJECT_EXPORT_COLUMNS).
 *  `width` = Excel chars, `widthPct` = PDF table percent (sums to 100). */
export const USER_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: UserExportRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'Username', width: 20, widthPct: 15, align: 'left', value: (r) => r.username },
  { header: 'ประเภทผู้ใช้งาน', width: 15, widthPct: 12, value: (r) => r.userType },
  { header: 'ชื่อผู้ใช้งาน', width: 24, widthPct: 18, align: 'left', value: (r) => r.fullName },
  { header: 'หน่วยงาน', width: 24, widthPct: 18, value: (r) => r.departmentName },
  { header: 'จังหวัด', width: 16, widthPct: 14, value: (r) => r.provinceName },
  { header: 'สิทธิ์การเข้าถึงข้อมูล', width: 26, widthPct: 18, value: (r) => r.roleText },
]
