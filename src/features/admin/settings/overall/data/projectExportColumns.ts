import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import type { Project, WarrantyStatus } from '../types/project'

dayjs.extend(buddhistEra)

/** Text labels mirrored from project/StatusBadge so the export reads exactly
 *  like the on-screen pills. */
export const WARRANTY_LABELS: Record<WarrantyStatus, string> = {
  'in-warranty': 'ในค้ำ',
  expired: 'หมดค้ำ',
  delivering: 'ระหว่างส่งมอบ',
}

/** "5 ก.ค. 2569" — same Thai short-month + Buddhist-year format TableProject
 *  (legacy) and ProjectListView (new) both render. */
export const fmtThaiDate = (iso: string): string => {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.locale('th').format('D MMM BBBB') : iso
}

/** Shared column config for both PDF and Excel exports of the โครงการ
 *  (project) list — used by both ProjectSection (legacy) and NewProjectSection
 *  so the two flavors of this screen export identically. SAME columns, SAME
 *  order as TableProject/ProjectListView (minus the จัดการ action column),
 *  plus ลำดับ (mirrors CONTACT_EXPORT_COLUMNS). `width` = Excel chars,
 *  `widthPct` = PDF table percent (sums to 100). */
export const PROJECT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Project, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 4, value: (_r, i) => i + 1 },
  { header: 'ผู้รับจ้าง', width: 28, widthPct: 13, align: 'left', value: (r) => r.contractor || '-' },
  { header: 'รหัสโครงการ', width: 14, widthPct: 8, value: (r) => r.code || '-' },
  { header: 'ชื่อโครงการ', width: 40, widthPct: 20, align: 'left', value: (r) => r.name || '-' },
  { header: 'ผู้ว่าจ้าง', width: 12, widthPct: 8, value: (r) => r.owner || '-' },
  { header: 'เลขที่สัญญา', width: 18, widthPct: 10, value: (r) => r.contractNo || '-' },
  { header: 'วันที่เริ่มต้นค้ำประกัน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.warrantyStart) },
  { header: 'วันที่สิ้นสุดค้ำประกัน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.warrantyEnd) },
  { header: 'สถานะการค้ำประกัน', width: 15, widthPct: 11, value: (r) => WARRANTY_LABELS[r.warrantyStatus] },
]
