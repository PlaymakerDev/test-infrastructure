"use client"
import React, { useState } from 'react'
import { ConfigProvider } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import type { PdfReportBlock } from '@/utils/export/pdf'
import { useVMSPmChartHour } from '../../../hooks'
import type { APIResponseVMSDetail } from '@/types/vms/detail-api'
import type { PmChartData } from '@/types/vms/pm-api'

dayjs.extend(buddhistEra)

const { RangePicker } = BuddhistDatePicker

interface Props {
  open: boolean
  onClose: () => void
  solutionId?: number
  detailData?: APIResponseVMSDetail
}

const FILENAME = 'VMS_Power_Report'
const TITLE = 'รายงานข้อมูลไฟฟ้าป้าย VMS (VMS Power Report)'

/** Block/sheet headings — the SAME strings the two on-screen charts use in
 *  ChartElectricalVMS, so the report reads as those charts. */
const VOLT_TITLE = 'แรงดันไฟฟ้าภายในตู้ควบคุม (Volt)'
const AMP_TITLE = 'กระแสไฟฟ้าภายในตู้ควบคุม (Amp)'
// Excel tab names cap at 31 chars (the util truncates) — short forms here,
// the full chart title still prints in each sheet's header block via `title`.
const VOLT_SHEET = 'แรงดันไฟฟ้า (Volt)'
const AMP_SHEET = 'กระแสไฟฟ้า (Amp)'

/** Meter readings ship as strings, and single-phase VMS rows carry the
 *  literal "NaN" in the unused phase fields — parse once with a finite guard
 *  so both exports format from real numbers. */
const num = (v: string | number | undefined | null) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}
const dt = (iso: string) => dayjs(iso).format('DD/MM/BBBB HH:mm')

/** "นำออกเอกสาร" for the VMS detail page — PDF + Excel of the two chart
 *  datasets (แรงดันไฟฟ้า Volt / กระแสไฟฟ้า Amp, single phase — the `v_avg` /
 *  `i_avg` series the on-screen charts render), sourced from
 *  `/vms/pm-chart-hour` (one row per HOUR). Default = the SAME trailing
 *  24-hour window the charts' "24 ชม." tab shows (fetch yesterday+today,
 *  trim to the last 24 h anchored on the newest bucket — 2026-09-02 request);
 *  picking dates in the RangePicker switches to whole-day custom mode.
 *  Ported from ExportBridgeLightingModal with Phase 1–3 collapsed to one. */
const ExportVMSPmModal: React.FC<Props> = ({ open, onClose, solutionId, detailData }) => {
  // Selected export range — defaults to yesterday..today, which in the
  // default (non-custom) mode is trimmed to the trailing 24 h below.
  // Persists across re-opens.
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(1, 'day'), dayjs()])
  // false = "24 ชม. ล่าสุด" (mirror the charts' default tab); true once the
  // user picks dates themselves — then the full whole-day range exports.
  const [custom, setCustom] = useState(false)
  // Draft-while-open pattern — see ExportBridgeLightingModal for the
  // rc-picker stale in-range band this avoids.
  const [draft, setDraft] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const startDate = range[0].format('YYYY-MM-DD')
  const endDate = range[1].format('YYYY-MM-DD')

  const pmQuery = useVMSPmChartHour(solutionId, startDate, endDate, open)

  /** Default mode trims to the trailing 24-h window, anchored on the newest
   *  bucket — the exact rule ChartElectricalVMS uses for its "24 ชม." tab. */
  const trim24h = (list: PmChartData[]): PmChartData[] => {
    if (custom || list.length === 0) return list
    const cutoff = new Date(list[list.length - 1].bucket).getTime() - 24 * 3600 * 1000
    return list.filter((r) => new Date(r.bucket).getTime() > cutoff)
  }

  // Array.isArray guard: the bridge twin returns a `{message, status}` OBJECT
  // on malformed dates — assume this endpoint can too.
  const loadedRows = Array.isArray(pmQuery.data?.data) ? trim24h(pmQuery.data.data) : null

  /** Rows for the clicked export — the cached query result, or (if the user
   *  clicks before the fetch settles) an awaited refetch of the same key. */
  const ensureRows = async (): Promise<PmChartData[]> => {
    if (loadedRows) return loadedRows
    const res = await pmQuery.refetch()
    return Array.isArray(res.data?.data) ? trim24h(res.data.data) : []
  }

  const solutionName = detailData?.solution?.solution_name || '-'
  const roadCode = detailData?.solution?.solution_location?.project_roads?.road?.road_code || '-'

  const buildFilterNote = (rows: PmChartData[]) => {
    const picked = custom
      ? `${range[0].format('DD/MM/BBBB')} - ${range[1].format('DD/MM/BBBB')}`
      : '24 ชม. ล่าสุด'
    const rangeNote = rows.length
      ? `${dt(rows[0].bucket)} - ${dt(rows[rows.length - 1].bucket)}`
      : 'ไม่มีข้อมูลมิเตอร์'
    return `จุดติดตั้ง: ${solutionName} · สายทาง: ${roadCode} · วันที่เลือก: ${picked} · ช่วงข้อมูล (รายชั่วโมง): ${rangeNote}`
  }

  const valueRows = (rows: PmChartData[], key: 'v_avg' | 'i_avg', decimals: number) =>
    rows.map((r) => [dt(r.bucket), fmtNumber(num(r[key]), decimals)])

  const onExportPdf = async () => {
    const rows = await ensureRows()
    const { exportReportPdf } = await import('@/utils/export/pdf')
    const emptyRow = [{ group: 'ไม่มีข้อมูลมิเตอร์ในช่วงเวลานี้' }]
    const blocks: PdfReportBlock[] = [
      {
        type: 'table',
        title: `${VOLT_TITLE} — หน่วย: V`,
        columns: [
          { header: 'เวลา', widthPct: 50, align: 'center' as const },
          { header: 'แรงดันไฟฟ้า (V)', widthPct: 50, align: 'right' as const },
        ],
        rows: rows.length ? valueRows(rows, 'v_avg', 2) : emptyRow,
      },
      {
        type: 'table',
        title: `${AMP_TITLE} — หน่วย: A`,
        columns: [
          { header: 'เวลา', widthPct: 50, align: 'center' as const },
          { header: 'กระแสไฟฟ้า (A)', widthPct: 50, align: 'right' as const },
        ],
        rows: rows.length ? valueRows(rows, 'i_avg', 3) : emptyRow,
      },
    ]

    await exportReportPdf({
      filenameBase: FILENAME,
      title: TITLE,
      subtitleNote: buildFilterNote(rows),
      blocks,
      orientation: 'portrait',
    })
  }

  const onExportExcel = async () => {
    const rows = await ensureRows()
    const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
    const filterNote = buildFilterNote(rows)
    const sheet = (sheetName: string, title: string, key: 'v_avg' | 'i_avg', unit: string) =>
      excelSheet({
        sheetName,
        title,
        filterNote,
        columns: [
          { header: 'เวลา', width: 20, value: (r: PmChartData) => dt(r.bucket) },
          {
            header: `${key === 'v_avg' ? 'แรงดันไฟฟ้า' : 'กระแสไฟฟ้า'} (${unit})`,
            width: 18,
            // Numbers, not strings — so the sheet stays sortable/chartable in
            // Excel; `fmtNumber` formatting is the PDF's job.
            value: (r: PmChartData) => num(r[key]) ?? '-',
          },
        ],
        rows,
      })

    exportExcelSheets({
      filenameBase: FILENAME,
      sheets: [
        sheet(VOLT_SHEET, VOLT_TITLE, 'v_avg', 'V'),
        sheet(AMP_SHEET, AMP_TITLE, 'i_avg', 'A'),
      ],
    })
  }

  // Light DatePicker tokens + `light-modal-popup` portal class, per the
  // light-modal convention (see ExportBridgeLightingModal).
  const extra = (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#FCD116' },
        components: {
          DatePicker: {
            colorText: '#1F1F1F',
            colorBorder: '#D9D9D9',
            colorTextPlaceholder: '#8A8A8A',
            borderRadius: 8,
            activeBorderColor: '#FCD116',
            hoverBorderColor: '#FCD116',
          },
        },
      }}
    >
      <div>
        <p style={{ color: '#212121', fontSize: 'var(--fs-12)', fontWeight: 500, marginBottom: 4 }}>
          ช่วงวันที่ข้อมูล (24 ชม. ล่าสุด เลือกได้ไม่เกิน 7 วัน)
        </p>
        <RangePicker
          value={draft ?? range}
          onOpenChange={(popupOpen) => setDraft(popupOpen ? [null, null] : null)}
          onCalendarChange={(dates) => setDraft(dates ?? [null, null])}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              setRange([dates[0], dates[1]])
              setCustom(true)
              setDraft(null)
            }
          }}
          allowClear={false}
          placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
          format='DD/MM/BBBB'
          className='w-full'
          // No future days; once one end is picked cap the other so the span
          // stays ≤ 7 days (mirrors the bridge-lighting export rules).
          disabledDate={(current, info) => {
            if (current.isAfter(dayjs(), 'day')) return true
            const from = info?.from
            return from ? Math.abs(current.diff(from, 'day')) >= 7 : false
          }}
          classNames={{ popup: { root: 'light-modal-popup' } }}
        />
      </div>
    </ConfigProvider>
  )

  return (
    <ExportFileModal
      open={open}
      onClose={onClose}
      count={pmQuery.isFetching ? undefined : loadedRows?.length}
      extra={extra}
      onExportPdf={onExportPdf}
      onExportExcel={onExportExcel}
    />
  )
}

export default React.memo<Props>(ExportVMSPmModal)
