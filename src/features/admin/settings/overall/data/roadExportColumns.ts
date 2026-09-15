import type { RoadData } from '@/types/manage/road-api'

export interface RoadExportRow {
  region: string
  department: string
  roadCode: string
  roadName: string
  subdistrict: string
  district: string
  province: string
  distance: string
}

/** Same field mapping as TableRoadData's on-screen renderers — keeps the
 *  export identical to what the table shows. */
export const toRoadExportRow = (row: RoadData): RoadExportRow => ({
  region: row.department?.region?.name_th || '-',
  department: row.department?.department_short_name || '-',
  roadCode: row.road_code || '-',
  roadName: row.road_name || '-',
  subdistrict: row.subdistrict || '-',
  district: row.district || '-',
  province: row.province || '-',
  distance: row.distance != null ? String(row.distance) : '-',
})

/** Shared column config for both PDF and Excel exports of the สายทาง (road)
 *  list. SAME columns, SAME order as TableRoadData (minus the จัดการ action
 *  column), plus ลำดับ (mirrors USER_EXPORT_COLUMNS/PROJECT_EXPORT_COLUMNS).
 *  `width` = Excel chars, `widthPct` = PDF table percent (sums to 100). */
export const ROAD_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: RoadExportRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'ภูมิภาค', width: 14, widthPct: 10, value: (r) => r.region },
  { header: 'หน่วยงาน', width: 20, widthPct: 14, value: (r) => r.department },
  { header: 'รหัสสายทาง', width: 16, widthPct: 12, align: 'left', value: (r) => r.roadCode },
  { header: 'ชื่อสายทาง', width: 26, widthPct: 18, align: 'left', value: (r) => r.roadName },
  { header: 'ตำบล', width: 16, widthPct: 12, value: (r) => r.subdistrict },
  { header: 'เขต', width: 16, widthPct: 12, value: (r) => r.district },
  { header: 'จังหวัด', width: 16, widthPct: 12, value: (r) => r.province },
  { header: 'ระยะทาง (กม.)', width: 10, widthPct: 5, align: 'right', value: (r) => r.distance },
]
