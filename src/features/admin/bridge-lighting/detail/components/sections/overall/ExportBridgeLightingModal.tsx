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
import { useBridgeLightingPmChartHour } from '../../../hooks'
import {
  APIResponseBridgeLightingOverview,
  APIResponseBridgeLightingWID,
  PmChartData,
} from '@/types/bridge-lighting/overall-api'

dayjs.extend(buddhistEra)

const { RangePicker } = BuddhistDatePicker

interface Props {
  open: boolean
  onClose: () => void
  locationData?: APIResponseBridgeLightingOverview
  widData?: APIResponseBridgeLightingWID
}

const FILENAME = 'Bridge_Lighting_Report'
const TITLE = 'รายงานข้อมูลไฟประดับสะพาน (Bridge Lighting Report)'

/** Block/sheet headings — the SAME strings the two on-screen charts use in
 *  ChartElectricalBridgeLighting, so the report reads as those charts. */
const VOLT_TITLE = 'แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
const AMP_TITLE = 'กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
// Excel tab names cap at 31 chars (the util truncates) — short forms here,
// the full chart title still prints in each sheet's header block via `title`.
const VOLT_SHEET = 'แรงดันไฟฟ้า 24 ชม. (Volt)'
const AMP_SHEET = 'กระแสไฟฟ้า 24 ชม. (Amp)'

/** The meter ships every reading as a string ("232.18") — parse once here so
 *  both exports format from real numbers instead of re-parsing per cell. */
const num = (v: string | number | undefined | null) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}
const dt = (iso: string) => dayjs(iso).format('DD/MM/BBBB HH:mm')

/** Per-phase keys behind each chart — mirrors VOLTAGE_LINES / CURRENT_LINES
 *  in ChartElectricalBridgeLighting (Phase 1–3 only; the Avg figure belongs to
 *  the VoltageStat cards, not the charts). */
const VOLT_KEYS = ['v_l1', 'v_l2', 'v_l3'] as const
const AMP_KEYS = ['i_l1', 'i_l2', 'i_l3'] as const

/** "นำออกเอกสาร" for the bridge-lighting detail page — PDF + Excel of the two
 *  chart datasets (แรงดันไฟฟ้า Volt / กระแสไฟฟ้า Amp per phase), sourced from
 *  `/pm-chart-hour` (BE 2026-08-31): one row per HOUR over a user-picked date
 *  range (RangePicker in the dialog, default = today), instead of the fixed
 *  last-24 h 5-minute feed the on-screen charts render. */
const ExportBridgeLightingModal: React.FC<Props> = ({
  open,
  onClose,
  locationData,
  widData,
}) => {
  // Selected export range (defaults to today — the closest match to the old
  // "current day so far" behaviour). Persists across re-opens on purpose.
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs(), dayjs()])
  // While the calendar popup is open the picker edits this DRAFT instead of
  // the committed range. It starts blank on every open — otherwise the old
  // range's far end stays paired with the newly clicked start and rc-picker
  // paints a stale in-range band across the month, which confused users
  // (2026-08-31 feedback: "เลือกวันที่แรกไม่ต้องมีสีเหลืองอ่อน"). Closing
  // without completing a pair reverts to the committed range.
  const [draft, setDraft] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const startDate = range[0].format('YYYY-MM-DD')
  const endDate = range[1].format('YYYY-MM-DD')

  const pmQuery = useBridgeLightingPmChartHour(widData?.wid, startDate, endDate, open)
  // Array.isArray guard: a malformed date comes back HTTP 200 with a
  // `{message, status}` OBJECT (verified live) — never trust the shape.
  const loadedRows = Array.isArray(pmQuery.data?.data) ? pmQuery.data.data : null

  /** Rows for the clicked export — the cached query result, or (if the user
   *  clicks before the fetch settles) an awaited refetch of the same key. */
  const ensureRows = async (): Promise<PmChartData[]> => {
    if (loadedRows) return loadedRows
    const res = await pmQuery.refetch()
    return Array.isArray(res.data?.data) ? res.data.data : []
  }

  const location = locationData?.locations?.[0]
  const solutionName = location?.solution?.solution_name || '-'
  const roadCode = location?.road?.code_name || '-'

  const buildFilterNote = (rows: PmChartData[]) => {
    const picked = `${range[0].format('DD/MM/BBBB')} - ${range[1].format('DD/MM/BBBB')}`
    const rangeNote = rows.length
      ? `${dt(rows[0].bucket)} - ${dt(rows[rows.length - 1].bucket)}`
      : 'ไม่มีข้อมูลมิเตอร์'
    return `จุดติดตั้ง: ${solutionName} · สายทาง: ${roadCode} · WID: ${widData?.wid ?? '-'} · วันที่เลือก: ${picked} · ช่วงข้อมูล (รายชั่วโมง): ${rangeNote}`
  }

  const phaseRows = (rows: PmChartData[], keys: typeof VOLT_KEYS | typeof AMP_KEYS, decimals: number) =>
    rows.map((r) => [
      dt(r.bucket),
      ...keys.map((k) => fmtNumber(num(r[k]), decimals)),
    ])

  const onExportPdf = async () => {
    const rows = await ensureRows()
    const { exportReportPdf } = await import('@/utils/export/pdf')
    const columns = [
      { header: 'เวลา', widthPct: 28, align: 'center' as const },
      { header: 'Phase 1', widthPct: 24, align: 'right' as const },
      { header: 'Phase 2', widthPct: 24, align: 'right' as const },
      { header: 'Phase 3', widthPct: 24, align: 'right' as const },
    ]
    const emptyRow = [{ group: 'ไม่มีข้อมูลมิเตอร์ในช่วงเวลานี้' }]
    const blocks: PdfReportBlock[] = [
      {
        type: 'table',
        title: `${VOLT_TITLE} — หน่วย: V`,
        columns,
        rows: rows.length ? phaseRows(rows, VOLT_KEYS, 2) : emptyRow,
      },
      {
        type: 'table',
        title: `${AMP_TITLE} — หน่วย: A`,
        columns,
        rows: rows.length ? phaseRows(rows, AMP_KEYS, 3) : emptyRow,
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
    const sheet = (
      sheetName: string,
      title: string,
      keys: typeof VOLT_KEYS | typeof AMP_KEYS,
      unit: string,
    ) =>
      excelSheet({
        sheetName,
        title,
        filterNote,
        columns: [
          { header: 'เวลา', width: 20, value: (r: PmChartData) => dt(r.bucket) },
          ...keys.map((k, i) => ({
            header: `Phase ${i + 1} (${unit})`,
            width: 14,
            // Numbers, not strings — so the sheet stays sortable/chartable in
            // Excel; `fmtNumber` formatting is the PDF's job.
            value: (r: PmChartData) => num(r[k]) ?? '-',
          })),
        ],
        rows,
      })

    exportExcelSheets({
      filenameBase: FILENAME,
      sheets: [
        sheet(VOLT_SHEET, VOLT_TITLE, VOLT_KEYS, 'V'),
        sheet(AMP_SHEET, AMP_TITLE, AMP_KEYS, 'A'),
      ],
    })
  }

  // Date-range picker inside the white dialog — light DatePicker tokens mirror
  // settings' ProjectModal (the canonical light-modal date fields), and the
  // calendar popup portals outside the modal DOM so it needs the shared
  // `light-modal-popup` root class, per the light-modal convention.
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
          ช่วงวันที่ข้อมูล (รายชั่วโมง เลือกได้ไม่เกิน 7 วัน)
        </p>
        <RangePicker
          value={draft ?? range}
          onOpenChange={(popupOpen) => setDraft(popupOpen ? [null, null] : null)}
          onCalendarChange={(dates) => setDraft(dates ?? [null, null])}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              setRange([dates[0], dates[1]])
              setDraft(null)
            }
          }}
          allowClear={false}
          placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
          format='DD/MM/BBBB'
          className='w-full'
          // No future days, and once one end is picked (`info.from`) cap the
          // other end so the span stays ≤ 7 days (2026-08-31 request).
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

export default React.memo<Props>(ExportBridgeLightingModal)
