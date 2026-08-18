"use client"
import React, { useMemo, useState } from 'react'
import { Alert, Button, Col, ConfigProvider, DatePicker, Row, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbBolt, TbPrinter } from 'react-icons/tb'
import BarChart from '@/components/chart/Barchart'
import type { BarChartDataPoint } from '@/components/chart/Barchart'
import { useLightingElectricity } from '@/hooks/queries/lighting'
import {
  COLOR_AMP_ORANGE,
  COLOR_VOLTAGE_CYAN,
  type VoltageAmpTableRow,
} from '../data/voltageAmpReport'
import { useDetailContext } from '../context'
import ExportFileModal from '@/components/export/ExportFileModal'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const { RangePicker } = DatePicker

type ReportPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY'
const REPORT_TYPE_MAP: Record<ReportPeriod, 'hourly' | 'daily' | 'monthly' | 'yearly'> = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(7, 'day'), dayjs()]

// The API's `label` shape depends on report_type (verified live): daily
// "YYYY-MM-DD", hourly "YYYY-MM-DD HH:mm", monthly "MM/YYYY", yearly "YYYY".
// Parse with the matching input format and re-render as Thai Buddhist-era
// text — used by the chart x-axis, the table's วันที่ column, and its export.
const formatReportLabel = (label: string, period: ReportPeriod): string => {
  switch (period) {
    case 'HOURLY':
      return dayjs(label, 'YYYY-MM-DD HH:mm').format('DD MMM BBBB HH:mm')
    case 'DAILY':
      return dayjs(label, 'YYYY-MM-DD').format('DD MMM BBBB')
    case 'MONTHLY':
      return dayjs(label, 'MM/YYYY').format('MMM BBBB')
    case 'YEARLY':
      return dayjs(label, 'YYYY').format('BBBB')
  }
}

const REPORT_PERIOD_OPTIONS: { label: string; value: ReportPeriod }[] = [
  { label: 'รายชั่วโมง', value: 'HOURLY' },
  { label: 'รายวัน', value: 'DAILY' },
  { label: 'รายเดือน', value: 'MONTHLY' },
  { label: 'รายปี', value: 'YEARLY' },
]

const FILTER_LABEL_CLASS = 'block fs-12 text-(--yellow)'
const FILTER_BOX_CLASS =
  'monitor-filter-box box-border flex items-center rounded-[10px] border border-(--yellow) bg-[#1A1A1A] px-1 py-0.5 h-[40px]'
const SEGMENTED_CLASS_NAMES = {
  root: 'min-w-max border-0! shadow-none! bg-transparent! p-0!',
} as const
const FILTER_SCROLL_CLASS =
  'overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  height: 220,
} as const

const AMP_CHART_PROPS = {
  ...SHARED_CHART_PROPS,
  yAxisTicks: [0, 1, 2, 3, 4] as number[],
}

// Phase identity colors — same 3 colors across both the Volt and Amp charts
// so a phase reads as the same color regardless of which metric is shown.
// Distinct from COLOR_VOLTAGE_CYAN/COLOR_AMP_ORANGE, which are the per-metric
// accent colors used for the chart icon/title and the AvgFooter value.
const COLOR_PHASE_1 = '#05F2DB'
const COLOR_PHASE_2 = '#B0FF03'
const COLOR_PHASE_3 = '#FCD116'

const VOLTAGE_BARS = [
  { dataKey: 'p1', color: COLOR_PHASE_1, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_2, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_PHASE_3, label: 'Phase 3' },
] as const

const AMP_BARS = [
  { dataKey: 'p1', color: COLOR_PHASE_1, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_2, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_PHASE_3, label: 'Phase 3' },
] as const

const AvgFooter: React.FC<{ value: string; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div
    className='py-2 px-3 rounded-lg text-center mt-3'
    style={{ background: '#00000080', border: `1px solid ${color}` }}
  >
    <p className='text-2xl font-bold mb-0' style={{ color }}>
      {value}
    </p>
    <p className='mb-0' style={{ fontSize: "var(--fs-12)", color: '#FFFFFF80' }}>{label}</p>
  </div>
)

const PHASE_CELL_COLORS = [COLOR_PHASE_1, COLOR_PHASE_2, COLOR_PHASE_3]

// Each row is already exactly one phase (see tableRows below) — just color
// the value by that row's phaseIndex, matching the chart's per-phase bars.
const phaseCell = (value: string | number, phaseIndex: number) => (
  <span style={{ color: PHASE_CELL_COLORS[phaseIndex] ?? COLOR_PHASE_1 }}>{value}</span>
)

// Shared column config for both PDF and Excel exports — same columns/order as
// the on-screen table (plus a Phase column, since the flat export can't rely
// on the on-screen row color + merged วันที่ cell to show phase grouping).
// `width` = Excel chars, `widthPct` = PDF percent (sums 100).
const SUMMARY_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (r: VoltageAmpTableRow) => string | number
}[] = [
    { header: 'วันที่', width: 16, widthPct: 16, value: (r) => r.date },
    { header: 'Phase', width: 8, widthPct: 8, value: (r) => r.phaseLabel },
    { header: 'แรงดันไฟฟ้า (V)', width: 16, widthPct: 15, value: (r) => r.voltage.toFixed(2) },
    { header: 'กระแสไฟฟ้า (A)', width: 16, widthPct: 15, value: (r) => r.amp.toFixed(2) },
    { header: 'กำลังไฟฟ้า (W)', width: 16, widthPct: 15, value: (r) => r.watt.toFixed(2) },
    { header: 'Power Factor', width: 14, widthPct: 13, value: (r) => r.powerFactor.toFixed(2) },
    { header: 'พลังงานไฟฟ้าที่ใช้ไป (kWh)', width: 22, widthPct: 9, value: (r) => r.kwh.toFixed(2) },
    { header: 'ความถี่ (Hz)', width: 14, widthPct: 9, value: (r) => r.frequency.toFixed(2) },
  ]

const SummaryReportSection: React.FC = () => {
  const { imei } = useDetailContext()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(DEFAULT_DATE_RANGE)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('DAILY')
  const [exportOpen, setExportOpen] = useState(false)

  const electricityQuery = useLightingElectricity(imei, {
    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
    report_type: REPORT_TYPE_MAP[reportPeriod],
  })
  const rows = useMemo(
    () => electricityQuery.data?.res_data ?? [],
    [electricityQuery.data],
  )
  const availablePhaseKeys = useMemo(
    () => new Set(rows.flatMap((row) => row.phases.map((phase) => `p${phase.phase}`))),
    [rows],
  )
  const voltageBars = useMemo(
    () => VOLTAGE_BARS.filter((bar) => availablePhaseKeys.has(bar.dataKey)),
    [availablePhaseKeys],
  )
  const ampBars = useMemo(
    () => AMP_BARS.filter((bar) => availablePhaseKeys.has(bar.dataKey)),
    [availablePhaseKeys],
  )
  // Chart x-axis labels: HOURLY spans hundreds of columns (8 days × 24h), so
  // the full "17 ส.ค. 2569 21:00" per column overflowed into "…เหมือนขาดหาย"
  // (auto-thinned + clipped, 2026-08-17). Compact it to a 2-line
  // "17 ส.ค. 69⏎21:00" for the axis and keep the FULL text in `tooltipLabel`
  // (BarChart's tooltip header override). Other periods keep the table's
  // format unchanged.
  const chartLabelFields = useMemo(
    () => (r: { label: string }): { label: string; tooltipLabel?: string } => {
      if (reportPeriod !== 'HOURLY') return { label: formatReportLabel(r.label, reportPeriod) }
      const d = dayjs(r.label, 'YYYY-MM-DD HH:mm')
      return {
        label: `${d.format('DD MMM BB')}\n${d.format('HH:mm')}`,
        tooltipLabel: d.format('DD MMM BBBB HH:mm'),
      }
    },
    [reportPeriod],
  )
  // Derive chart + table data from the API rows. Each row has a `phases[]`
  // array (phase 1/2/3); we flatten to per-row {p1, p2, p3} for the charts
  // and average the phases for the table row.
  const voltageChartData: BarChartDataPoint[] = useMemo(
    () => rows.filter((r) => r.phases.length > 0).map((r) => {
      const p1 = r.phases.find((p) => p.phase === '1')
      const p2 = r.phases.find((p) => p.phase === '2')
      const p3 = r.phases.find((p) => p.phase === '3')
      return {
        ...chartLabelFields(r),
        p1: p1?.voltage ?? 0,
        p2: p2?.voltage ?? 0,
        p3: p3?.voltage ?? 0,
      }
    }),
    [rows, chartLabelFields],
  )
  const ampChartData: BarChartDataPoint[] = useMemo(
    () => rows.filter((r) => r.phases.length > 0).map((r) => {
      const p1 = r.phases.find((p) => p.phase === '1')
      const p2 = r.phases.find((p) => p.phase === '2')
      const p3 = r.phases.find((p) => p.phase === '3')
      return {
        ...chartLabelFields(r),
        p1: p1?.amplitude ?? 0,
        p2: p2?.amplitude ?? 0,
        p3: p3?.amplitude ?? 0,
      }
    }),
    [rows, chartLabelFields],
  )
  // Hourly data is dense enough to need pan/zoom; the other periods rarely
  // exceed a screenful. Threshold on actual column count so a 1-day hourly
  // report (24 columns) still renders plain.
  const chartZoom = voltageChartData.length > 40 ? { initialWindow: 48 } : false

  // One row per (date, phase) — a 3-phase date expands to 3 colored rows with
  // the วันที่ cell row-spanned across them (see the date column's onCell
  // below); a 1-phase date stays exactly one row, unchanged from before.
  const tableRows: VoltageAmpTableRow[] = useMemo(
    () => rows.filter((r) => r.phases.length > 0).flatMap((r, i) => {
      const dateLabel = formatReportLabel(r.label, reportPeriod)
      return r.phases.map((p, phaseIndex) => ({
        key: `${r.label}-${i}-${p.phase}`,
        date: dateLabel,
        dateRowSpan: phaseIndex === 0 ? r.phases.length : 0,
        phaseIndex,
        phaseLabel: p.phase,
        voltage: p.voltage,
        amp: p.amplitude,
        watt: p.watt,
        powerFactor: p.power_factor,
        kwh: (p.watt * 3600) / 3600000,
        frequency: p.frequency,
      }))
    }),
    [rows, reportPeriod],
  )
  const hasData = electricityQuery.isSuccess && tableRows.length > 0

  // Per-date, phase-averaged rows — kept separate from tableRows (now one row
  // per phase) purely to feed the AvgFooter/"รวมเฉลี่ย" summary numbers.
  const dailyAverages = useMemo(
    () => rows.filter((r) => r.phases.length > 0).map((r) => {
      const avg = (sel: (p: typeof r.phases[number]) => number) =>
        r.phases.reduce((s, p) => s + sel(p), 0) / r.phases.length
      return {
        voltage: avg((p) => p.voltage),
        amp: avg((p) => p.amplitude),
        watt: avg((p) => p.watt),
        powerFactor: avg((p) => p.power_factor),
        frequency: avg((p) => p.frequency),
      }
    }),
    [rows],
  )

  const averages = useMemo(() => {
    const avg = (sel: (r: typeof dailyAverages[number]) => number) =>
      dailyAverages.length ? dailyAverages.reduce((s, r) => s + sel(r), 0) / dailyAverages.length : 0
    return {
      voltage: avg((r) => r.voltage),
      amp: avg((r) => r.amp),
      watt: avg((r) => r.watt),
      powerFactor: avg((r) => r.powerFactor),
      frequency: avg((r) => r.frequency),
    }
  }, [dailyAverages])

  const columns: ColumnsType<VoltageAmpTableRow> = useMemo(
    () => [
      {
        title: 'วันที่',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
        width: 140,
        onCell: (record) => ({ rowSpan: record.dateRowSpan }),
        render: (value: string) => <span className='text-white'>{value}</span>,
      },
      {
        title: 'แรงดันไฟฟ้า (V)',
        dataIndex: 'voltage',
        key: 'voltage',
        align: 'center',
        width: 130,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
      {
        title: 'กระแสไฟฟ้า (A)',
        dataIndex: 'amp',
        key: 'amp',
        align: 'center',
        width: 120,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
      {
        title: 'กำลังไฟฟ้า (W)',
        dataIndex: 'watt',
        key: 'watt',
        align: 'center',
        width: 120,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
      {
        title: 'Power Factor',
        dataIndex: 'powerFactor',
        key: 'powerFactor',
        align: 'center',
        width: 110,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
      {
        title: 'พลังงานไฟฟ้าที่ใช้ไป (kWh)',
        dataIndex: 'kwh',
        key: 'kwh',
        align: 'center',
        width: 170,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
      {
        title: 'ความถี่ (Hz)',
        dataIndex: 'frequency',
        key: 'frequency',
        align: 'center',
        width: 110,
        render: (value: number, record) => phaseCell(value.toFixed(2), record.phaseIndex),
      },
    ],
    [],
  )

  const tableSummary = () => {
    const white = { color: '#FFFFFF', fontWeight: 600 } as const
    return (
      <Table.Summary.Row style={{ background: '#191919' }}>
        <Table.Summary.Cell index={0} align='center'>
          <span style={white}>รวมเฉลี่ย</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align='center'>
          <span style={white}>{hasData ? averages.voltage.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align='center'>
          <span style={white}>{hasData ? averages.amp.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align='center'>
          <span style={white}>{hasData ? averages.watt.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} align='center'>
          <span style={white}>{hasData ? averages.powerFactor.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align='center'>
          <span style={white}>-</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={6} align='center'>
          <span style={white}>{hasData ? averages.frequency.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    )
  }

  return (
    <div className='flex flex-col gap-4 pb-5'>
      <h3 className='text-[#FCD116] text-base sm:text-lg m-0' style={{ fontWeight: 400 }}>
        แผนภูมิและตารางแสดงค่ากระแสไฟฟ้าและแรงดันไฟฟ้า
      </h3>

      {electricityQuery.isError && (
        <Alert
          type='error'
          showIcon
          message='ไม่สามารถโหลดรายงานค่ากระแสไฟฟ้าได้'
          action={<Button size='small' onClick={() => void electricityQuery.refetch()}>ลองใหม่</Button>}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChart
            {...SHARED_CHART_PROPS}
            title='แผนภูมิแสดงค่าการทำงานของตู้ควบคุมไฟ (Volt)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_VOLTAGE_CYAN}
            data={voltageChartData}
            bars={voltageBars}
            dataZoom={chartZoom}
            xAxisContainLabel
            footer={
              <AvgFooter
                value={hasData ? `${averages.voltage.toFixed(2)} V` : '-'}
                label='Avg Voltage'
                color={COLOR_VOLTAGE_CYAN}
              />
            }
          />
        </Col>
        <Col xs={24} lg={12}>
          <BarChart
            {...AMP_CHART_PROPS}
            title='แผนภูมิแสดงค่าการทำงานของตู้ควบคุมไฟ (Amp)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_AMP_ORANGE}
            data={ampChartData}
            bars={ampBars}
            dataZoom={chartZoom}
            xAxisContainLabel
            footer={
              <AvgFooter
                value={hasData ? `${averages.amp.toFixed(2)} A` : '-'}
                label='Avg Current'
                color={COLOR_AMP_ORANGE}
              />
            }
          />
        </Col>
      </Row>

      <style>{`
        .summary-filter-date .ant-picker {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          width: 100% !important;
          height: 34px !important;
          padding: 0 4px !important;
        }
        .summary-filter-date .ant-picker-input > input {
          color: #ffffff !important;
          font-size: 14px !important;
        }
        .summary-filter-date .ant-picker-active-bar {
          display: none !important;
        }
        .summary-filter-date .ant-picker-suffix {
          color: #fcd116 !important;
          margin-inline-start: 4px;
        }
        .summary-filter-segmented .ant-segmented {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .summary-filter-segmented .ant-segmented-group {
          gap: 4px;
        }
        .summary-filter-segmented .ant-segmented-item {
          border-radius: 5px !important;
        }
        .summary-filter-segmented .ant-segmented-item-selected {
          border-radius: 5px !important;
        }
        .summary-filter-segmented .ant-segmented-thumb {
          border-radius: 5px !important;
        }
        .summary-filter-segmented .ant-segmented-item-label {
          min-height: 32px !important;
          line-height: 32px !important;
          padding: 0 10px !important;
          font-size: 14px !important;
        }
      `}</style>

      <div className={`flex items-end gap-4 flex-nowrap ${FILTER_SCROLL_CLASS}`}>
        <div className='flex flex-col gap-1 shrink-0'>
          <span className={FILTER_LABEL_CLASS}>วันที่แสดงข้อมูล</span>
          <div className={`${FILTER_BOX_CLASS} summary-filter-date w-[268px] shrink-0`}>
            <ConfigProvider locale={thTH}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format='D MMM BBBB'
                size='middle'
                allowClear={false}
                className='w-full!'
                placeholder={['เลือกวันที่เริ่มต้น', 'เลือกวันที่สิ้นสุด']}
              />
            </ConfigProvider>
          </div>
        </div>

        <div className='flex items-end gap-3 shrink-0'>
          <div className='flex flex-col gap-1'>
            <span className={FILTER_LABEL_CLASS}>ประเภทรายงาน</span>
            <div className={`${FILTER_BOX_CLASS} summary-filter-segmented`}>
              <Segmented
                value={reportPeriod}
                onChange={(value) => setReportPeriod(value as ReportPeriod)}
                options={REPORT_PERIOD_OPTIONS}
                size='middle'
                classNames={SEGMENTED_CLASS_NAMES}
              />
            </div>
          </div>

          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              type='primary'
              shape='round'
              icon={<TbPrinter />}
              style={{ height: 40 }}
              className='shrink-0'
              onClick={() => setExportOpen(true)}
            >
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
        </div>
      </div>

      {/* นำออกเอกสาร — exports the currently-filtered tableRows (no server
          pagination here, unlike the Monitor tab's log table). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={tableRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Lighting_Summary_Report',
            title: 'รายงานสรุปการทำงาน (Voltage/Amp Summary Report)',
            columns: SUMMARY_EXPORT_COLUMNS,
            rows: tableRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Lighting_Summary_Report',
            sheetName: 'Summary Report',
            title: 'รายงานสรุปการทำงาน (Voltage/Amp Summary Report)',
            columns: SUMMARY_EXPORT_COLUMNS,
            rows: tableRows,
          })
        }}
      />

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<VoltageAmpTableRow>
          rowKey='key'
          columns={columns}
          dataSource={tableRows}
          loading={electricityQuery.isFetching}
          pagination={false}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{
            emptyText: electricityQuery.isError
              ? 'ไม่สามารถโหลดข้อมูลได้'
              : !imei
                ? 'ไม่มี IMEI — ไม่สามารถโหลดรายงานได้'
                : electricityQuery.isLoading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล',
          }}
          summary={tableSummary}
        />
      </div>
    </div>
  )
}

export default React.memo(SummaryReportSection)
