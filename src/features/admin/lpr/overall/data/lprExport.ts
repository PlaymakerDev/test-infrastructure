import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { groupLPRList } from './groupLPRList'

/** One export row = one install point (จุดติดตั้ง) + the bureau it sits under.
 *  The on-screen table shows the bureau as a divider row, so the export
 *  flattens it into a หน่วยงาน lead column (same treatment as cctv / tunnel). */
export interface LPRExportRow {
  bureau: string
  item: SubDptSolution
}

/** Rows in the SAME order the table displays — run through the same grouping
 *  TableLPRData renders from, then keep only the install-point rows. Pass the
 *  already status-filtered / searched list so the export is exactly what's on
 *  screen. */
export const toLPRExportRows = (list: ListData[] | undefined): LPRExportRow[] => {
  const out: LPRExportRow[] = []
  let bureau = ''
  for (const row of groupLPRList(list)) {
    if (row.kind === 'bureau') bureau = row.bureau
    else out.push({ bureau, item: row.item })
  }
  return out
}

/** Mirrors ContractInfoCell's visible label: contract no → ปีงบประมาณ → '-'. */
const contractLabel = ({ item }: LPRExportRow) => {
  const contractNo = item.project?.contract_no?.trim()
  if (contractNo) return contractNo
  const budgetYear = item.project?.budget_year
  return budgetYear ? `ปีงบประมาณ ${budgetYear}` : '-'
}

// Shared column config for PDF and Excel — SAME columns, SAME order as the
// on-screen TableLPRData (รหัสสายทาง → ชื่อโครงการ → เลขที่สัญญา → การค้ำประกัน
// → จุดติดตั้ง → กล้องตรวจจับป้ายทะเบียน → สถานะ), plus ลำดับ/หน่วยงาน for the
// flattened bureau dividers. Skipped on purpose: Stream (a button column that
// only restates สถานะ) and ป้ายทะเบียน (the central-list contract has no
// detected-plate total yet, so it would export an empty column). `width` =
// Excel chars, `widthPct` = PDF table percent (sums to 100).
export const LPR_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: LPRExportRow, index: number) => string | number
}[] = [
    { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
    { header: 'หน่วยงาน', width: 18, widthPct: 12, value: (r) => r.bureau || '-' },
    { header: 'รหัสสายทาง', width: 13, widthPct: 10, value: (r) => r.item.road?.code_name || '-' },
    { header: 'ชื่อโครงการ', width: 34, widthPct: 20, align: 'left', value: (r) => r.item.project?.project_name || '-' },
    { header: 'เลขที่สัญญา', width: 20, widthPct: 13, value: contractLabel },
    { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.item.is_warranty ? 'ในค้ำ' : 'หมดค้ำ') },
    { header: 'จุดติดตั้ง', width: 34, widthPct: 18, align: 'left', value: (r) => r.item.solution?.solution_name || '-' },
    { header: 'กล้องตรวจจับป้ายทะเบียน', width: 24, widthPct: 8, value: (r) => r.item.lpr?.total_camera ?? 0 },
    { header: 'สถานะ', width: 12, widthPct: 6, value: (r) => (r.item.is_online ? 'ออนไลน์' : 'ออฟไลน์') },
  ]
