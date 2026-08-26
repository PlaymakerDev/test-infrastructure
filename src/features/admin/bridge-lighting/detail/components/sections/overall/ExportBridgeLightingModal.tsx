"use client"
import React from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import type { PdfReportBlock } from '@/utils/export/pdf'
import {
  APIResponseBridgeLightingOverview,
  APIResponseBridgeLightingWID,
  APIResponsePostPmChart,
  PmChartData,
} from '@/types/bridge-lighting/overall-api'

dayjs.extend(buddhistEra)

interface Props {
  open: boolean
  onClose: () => void
  locationData?: APIResponseBridgeLightingOverview
  widData?: APIResponseBridgeLightingWID
  pmChartData?: APIResponsePostPmChart
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
 *  chart datasets only: แรงดันไฟฟ้า (Volt) and กระแสไฟฟ้า (Amp) per phase,
 *  one row per 5-minute bucket, exactly the series the charts plot. */
const ExportBridgeLightingModal: React.FC<Props> = ({
  open,
  onClose,
  locationData,
  widData,
  pmChartData,
}) => {
  const location = locationData?.locations?.[0]
  const pmRows: PmChartData[] = pmChartData ?? []

  const solutionName = location?.solution?.solution_name || '-'
  const roadCode = location?.road?.code_name || '-'
  const rangeNote = pmRows.length
    ? `${dt(pmRows[0].bucket)} - ${dt(pmRows[pmRows.length - 1].bucket)}`
    : 'ไม่มีข้อมูลมิเตอร์'
  const filterNote = `จุดติดตั้ง: ${solutionName} · สายทาง: ${roadCode} · WID: ${widData?.wid ?? '-'} · ช่วงข้อมูล: ${rangeNote}`

  const phaseRows = (keys: typeof VOLT_KEYS | typeof AMP_KEYS, decimals: number) =>
    pmRows.map((r) => [
      dt(r.bucket),
      ...keys.map((k) => fmtNumber(num(r[k]), decimals)),
    ])

  const onExportPdf = async () => {
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
        rows: pmRows.length ? phaseRows(VOLT_KEYS, 2) : emptyRow,
      },
      {
        type: 'table',
        title: `${AMP_TITLE} — หน่วย: A`,
        columns,
        rows: pmRows.length ? phaseRows(AMP_KEYS, 3) : emptyRow,
      },
    ]

    await exportReportPdf({
      filenameBase: FILENAME,
      title: TITLE,
      subtitleNote: filterNote,
      blocks,
      orientation: 'portrait',
    })
  }

  const onExportExcel = async () => {
    const { exportExcelSheets, excelSheet } = await import('@/utils/export/excel')
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
        rows: pmRows,
      })

    exportExcelSheets({
      filenameBase: FILENAME,
      sheets: [
        sheet(VOLT_SHEET, VOLT_TITLE, VOLT_KEYS, 'V'),
        sheet(AMP_SHEET, AMP_TITLE, AMP_KEYS, 'A'),
      ],
    })
  }

  return (
    <ExportFileModal
      open={open}
      onClose={onClose}
      count={pmRows.length}
      onExportPdf={onExportPdf}
      onExportExcel={onExportExcel}
    />
  )
}

export default React.memo<Props>(ExportBridgeLightingModal)
