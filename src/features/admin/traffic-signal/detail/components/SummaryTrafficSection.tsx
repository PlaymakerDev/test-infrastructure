"use client"
import React, { useMemo, useRef, useState } from 'react'
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
import { useTrafficReports, useTrafficSummary } from '@/hooks/queries/traffic-signal'
import type { PdfReportBlock } from '@/utils/export/pdf'
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
  // Wraps the 4 performance charts — the PDF export rasterizes the live
  // ECharts instances found inside (same capture flow as traffic-volume's
  // analyticvolume report).
  const chartsRef = useRef<HTMLDivElement | null>(null)

  // Same id + params as TableSummaryTraffic below — TanStack dedupes on the
  // shared query key, so this reads from the cache the table already filled
  // (no extra request).
  const { data: reportData } = useTrafficReports(project.id, {
    page: 1,
    limit: 100,
    start_date: startDate,
    end_date: endDate,
  })
  // Same key as Perf7DayCharts / DailyVolumeCards — cache read, no extra
  // request. Feeds the PDF's สรุปค่าเฉลี่ย kv block + day-card table so the
  // exported numbers use the SAME source + math as the on-screen components.
  const { data: summaryData } = useTrafficSummary(project.id, { date: endDate })

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
          const [{ exportReportPdf }, { captureEchartsPng }] = await Promise.all([
            import('@/utils/export/pdf'),
            import('@/utils/export/chart'),
          ])

          // 1) The 4 performance charts, rasterized from the live ECharts
          //    instances (DOM order = PCU → Efficiency → ET → Time saved).
          const charts = chartsRef.current ? await captureEchartsPng(chartsRef.current) : []
          const CHART_TITLES = [
            'ปริมาณจราจร (PCU) สูงสุดรายวัน',
            'ประสิทธิภาพการทำงานของระบบรายวัน',
            'Early Termination Rate',
            'เวลาที่ระบบช่วยประหยัด',
          ]
          const blocks: PdfReportBlock[] = charts.map((c, i) => ({
            type: 'image',
            title: CHART_TITLES[i],
            ...c,
          }))

          // 2) สรุปค่าเฉลี่ย 7 วัน — same math + format expressions as the
          //    AvgFooter cards under each chart.
          const days = summaryData ?? []
          const n = days.length || 1
          const sum = days.reduce(
            (acc, d) => ({
              pcu: acc.pcu + d.total_pcu,
              eff: acc.eff + d.avg_efficiency,
              et: acc.et + d.avg_early_termination,
              time: acc.time + d.total_time_saved,
            }),
            { pcu: 0, eff: 0, et: 0, time: 0 },
          )
          blocks.push({
            type: 'kv',
            title: 'สรุปประสิทธิภาพย้อนหลัง 7 วัน',
            items: [
              { label: 'Avg Daily PCU', value: fmtNumber(sum.pcu / n, 1) },
              { label: 'Avg Efficiency', value: `${fmtNumber(sum.eff / n, 0)}%` },
              { label: 'Avg ET Rate', value: `${fmtNumber(sum.et / n, 0)}%` },
              { label: 'Total Time Saved', value: `${fmtNumber(sum.time, 1)}h` },
            ],
          })

          // 3) เปรียบเทียบปริมาณจราจรรายวัน — the on-screen day cards
          //    (P1..Pn PCU + Total + Peak) flattened into a compact table.
          if (days.length > 0) {
            const phaseNumbers = Array.from({ length: project.phase }, (_, i) => i + 1)
            const phasePct = Math.floor(46 / phaseNumbers.length)
            blocks.push({
              type: 'table',
              title: 'เปรียบเทียบปริมาณจราจรย้อนหลัง 7 วัน',
              columns: [
                { header: 'วันที่', widthPct: 100 - 30 - phasePct * phaseNumbers.length, align: 'left' },
                ...phaseNumbers.map((p) => ({ header: `P${p} (PCU)`, widthPct: phasePct })),
                { header: 'รวม PCU', widthPct: 16 },
                { header: 'Peak', widthPct: 14 },
              ],
              rows: days.map((d) => {
                const values: Record<number, number> = {}
                for (const p of d.phases ?? []) values[p.phase_no] = p.pcu
                return [
                  `วัน${thaiDayName(d.day)} ${dayjs(d.date).locale('th').format('D MMM BBBB')}`,
                  ...phaseNumbers.map((p) => fmtNumber(values[p] ?? 0, 2)),
                  fmtNumber(d.total_pcu, 2),
                  `Phase ${d.peak_phase}`,
                ]
              }),
            })
          }

          // 4) ตารางข้อมูลแยกจราจรรายเฟส — same headers/rows as the Excel
          //    export and the on-screen table, but with its own widthPct set:
          //    SUMMARY_EXPORT_COLUMNS' percentages are tuned for the landscape
          //    exportTablePdf page; this block report renders portrait (the
          //    exportReportPdf default), where those narrow columns squeezed
          //    headers into mid-word wraps ("Pha se").
          const PDF_PHASE_TABLE_WIDTHS = [13, 8, 11, 11, 11, 15, 15, 16]
          blocks.push({
            type: 'table',
            title: 'ตารางข้อมูลแยกจราจรย้อนหลัง 7 วัน',
            columns: SUMMARY_EXPORT_COLUMNS.map(({ header, align }, i) => ({
              // Explicit newline — wrapPdfText splits on \n before measuring,
              // so the header breaks cleanly as "ลดปริมาณ CO2" / "(kg)"
              // instead of the greedy wrap's "( kg)" split.
              header: header === 'ลดปริมาณ CO2 (kg)' ? 'ลดปริมาณ CO2\n(kg)' : header,
              widthPct: PDF_PHASE_TABLE_WIDTHS[i],
              align,
            })),
            rows: exportRows.map((r, i) =>
              SUMMARY_EXPORT_COLUMNS.map((c, ci) => {
                const v = c.value(r, i)
                // Date cells: break after the day name (same 2-line layout
                // as the on-screen table) — the Thai segmenter otherwise
                // chops the "ก.ค." abbreviation mid-token ("21 ก" / ".ค.").
                return ci === 0 ? String(v).replace(' ', '\n') : v
              }),
            ),
          })

          await exportReportPdf({
            filenameBase: 'Traffic_Signal_Summary_Report',
            title: 'รายงานข้อมูลแยกจราจรย้อนหลัง 7 วัน (Traffic Signal 7-Day Summary)',
            subtitleNote: exportFilterNote,
            blocks,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Signal_Summary_Report',
            sheetName: 'Traffic Signal Summary',
            title: 'รายงานข้อมูลแยกจราจรย้อนหลัง 7 วัน (Traffic Signal 7-Day Summary)',
            filterNote: exportFilterNote,
            columns: SUMMARY_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section>
        <h3 className='text-(--yellow) mb-4'>
          เปรียบเทียบประสิทธิภาพการทำงานของระบบย้อนหลัง 7 วัน
        </h3>
        {/* ref target for the PDF chart capture — keep it wrapping ONLY the
            4 performance charts so capture order stays deterministic. */}
        <div ref={chartsRef}>
          <Perf7DayChartsSummaryTraffic endDate={endDate} />
        </div>
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
