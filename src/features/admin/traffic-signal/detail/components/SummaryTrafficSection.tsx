"use client"
import React, { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import {
  FormSearchSummaryTraffic,
  Perf7DayChartsSummaryTraffic,
  DailyVolumeCardsSummaryTraffic,
  TableSummaryTraffic,
} from '../components'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useTrafficReports } from '@/hooks/queries/traffic-signal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDayName } from '@/utils/formatDate'
import { thaiDateBE } from '@/utils/thaiDate'
import { useDetailContext } from '../context'

// `BBBB` (Buddhist-Era year) for the exported วันที่ column (`D MMM BBBB`).
dayjs.extend(buddhistEra)

interface Props { }

/** One exported row = one phase of one day — mirrors TableSummaryTraffic's
 *  flattened per-phase layout (date repeated per row instead of rowSpan). */
interface SummaryExportRow {
  date: string
  phase: number
  greenSec: number
  redSec: number
  pcu: number
  efficiency: number
  timeSaved: number
  co2: number
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order + format expressions as the on-screen TableSummaryTraffic. `width` =
// Excel chars, `widthPct` = PDF table percent (sums to 100).
const SUMMARY_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: SummaryExportRow, index: number) => string | number
}[] = [
  { header: 'วันที่', width: 22, widthPct: 14, align: 'left', value: (r) => r.date },
  { header: 'Phase', width: 8, widthPct: 6, value: (r) => r.phase },
  { header: 'ช่วงเวลาไฟเขียว (s)', width: 18, widthPct: 13, value: (r) => fmtNumber(r.greenSec, 2) },
  { header: 'ช่วงเวลาไฟแดง (s)', width: 18, widthPct: 13, value: (r) => fmtNumber(r.redSec, 2) },
  { header: 'รวม PCU', width: 14, widthPct: 12, value: (r) => fmtNumber(r.pcu, 2) },
  { header: 'ประสิทธิภาพ (%)', width: 16, widthPct: 13, value: (r) => `${fmtNumber(r.efficiency, 2)} %` },
  { header: 'ประหยัดเวลา (m)', width: 16, widthPct: 14, value: (r) => fmtNumber(r.timeSaved, 2) },
  { header: 'ลดปริมาณ CO2 (kg)', width: 18, widthPct: 15, value: (r) => fmtNumber(r.co2, 2) },
]

const SummaryTrafficSection: React.FC<Props> = () => {
  const { project } = useDetailContext()
  // Tab 2 uses a fixed 7-day window so the cards / charts / table all stay
  // aligned by construction. The user picks ONE anchor date (treated as the
  // end of the window); start = anchor − 6 days (inclusive).
  const [anchor, setAnchor] = useState<Dayjs>(() => dayjs())
  const [exportOpen, setExportOpen] = useState(false)
  const endDate = anchor.format('YYYY-MM-DD')
  const startDate = anchor.subtract(6, 'day').format('YYYY-MM-DD')

  // Same id + params as TableSummaryTraffic below — TanStack dedupes on the
  // shared query key, so this reads from the cache the table already filled
  // (no extra request).
  const { data: reportData } = useTrafficReports(project.id, {
    page: 1,
    limit: 100,
    start_date: startDate,
    end_date: endDate,
  })

  // Flatten the 7-day response into per-phase rows — SAME slicing + date
  // label expressions as TableSummaryTraffic (newline swapped for a space
  // since export cells are single-line).
  const exportRows = useMemo<SummaryExportRow[]>(() => {
    const out: SummaryExportRow[] = []
    for (const day of reportData?.res_data ?? []) {
      for (const p of (day.data ?? []).slice(0, project.phase)) {
        out.push({
          date: `วัน${thaiDayName(day.day)} ${dayjs(day.date).locale('th').format('D MMM BBBB')}`,
          phase: p.phases_no,
          greenSec: p.avg_green_time,
          redSec: p.avg_waithing_time,
          pcu: p.total_pcu,
          efficiency: p.efficiency,
          timeSaved: p.total_time_saved,
          co2: p.total_carbon_saved,
        })
      }
    }
    return out
  }, [reportData, project.phase])

  // Install point + resolved 7-day window — printed in the PDF header so a
  // reader knows which signal/date range they're looking at (mirrors the
  // form's "ช่วงข้อมูล" helper line).
  const exportFilterNote = `${project.installPoint} · ช่วงข้อมูล ${thaiDateBE(anchor.subtract(6, 'day').toDate())} – ${thaiDateBE(anchor.toDate())}`

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <FormSearchSummaryTraffic
          value={anchor}
          onChange={setAnchor}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the SAME per-phase rows the 7-day table
            below shows, through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Signal_Summary_Report',
            title: 'รายงานข้อมูลแยกจราจรย้อนหลัง 7 วัน (Traffic Signal 7-Day Summary)',
            filterNote: exportFilterNote,
            columns: SUMMARY_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Signal_Summary_Report',
            sheetName: 'Traffic Signal Summary',
            columns: SUMMARY_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section>
        <h3 className='text-(--yellow) mb-4'>
          เปรียบเทียบประสิทธิภาพการทำงานของระบบย้อนหลัง 7 วัน
        </h3>
        <Perf7DayChartsSummaryTraffic endDate={endDate} />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>เปรียบเทียบปริมาณจราจรย้อนหลัง 7 วัน</h3>
        <DailyVolumeCardsSummaryTraffic endDate={endDate} />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>ตารางข้อมูลแยกจราจรย้อนหลัง 7 วัน</h3>
        <TableSummaryTraffic startDate={startDate} endDate={endDate} />
      </section>
    </div>
  )
}

export default React.memo<Props>(SummaryTrafficSection)
