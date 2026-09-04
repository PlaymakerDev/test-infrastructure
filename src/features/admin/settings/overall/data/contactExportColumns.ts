import dayjs from 'dayjs'
import type { Contractor } from '../types/contractor'

/** "06/07/2569" — same dd/MM/พ.ศ. format TableContact renders. */
export const fmtThaiDate = (iso: string): string => {
  if (!iso) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD/MM/BBBB') : iso
}

/** Shared column config for both PDF and Excel exports of the ผู้รับจ้าง
 *  (contractor) list — used by both ContactSection (legacy) and
 *  NewContactSection so the two flavors of this screen export identically.
 *  SAME columns, SAME order as TableContact (minus the จัดการ action
 *  column), plus ลำดับ (mirrors CCTV_EXPORT_COLUMNS). `width` = Excel chars,
 *  `widthPct` = PDF table percent (sums to 100). Email/address/username are
 *  NOT on the on-screen table so they're not exported; no password field
 *  exists on the UI Contractor row. */
export const CONTACT_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Contractor, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'ชื่อบริษัท', width: 36, widthPct: 24, align: 'left', value: (r) => r.companyName || '-' },
  { header: 'ชื่อย่อ', width: 12, widthPct: 10, value: (r) => r.shortName || '-' },
  { header: 'ผู้ติดต่อ', width: 20, widthPct: 14, value: (r) => r.contactPerson || '-' },
  { header: 'เบอร์โทรศัพท์', width: 16, widthPct: 12, value: (r) => r.phone || '-' },
  { header: 'ตำแหน่ง / บทบาท', width: 18, widthPct: 12, value: (r) => r.role || '-' },
  { header: 'วันที่ลงทะเบียน', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.registeredAt) },
  { header: 'จำนวนโครงการ', width: 14, widthPct: 10, value: (r) => r.projectCount },
]
