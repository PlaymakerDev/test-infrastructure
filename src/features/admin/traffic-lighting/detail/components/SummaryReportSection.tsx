"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, ConfigProvider, DatePicker, Row, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbBolt, TbPrinter } from 'react-icons/tb'
import BarChart from '@/components/chart/Barchart'
import type { BarChartDataPoint } from '@/components/chart/Barchart'
import { getLightingElectricityAPI } from '@/services/routes/LightingService'
import type { ElectricityAggItem } from '@/types/lighting'
import {
  COLOR_AMP_ORANGE,
  COLOR_VOLTAGE_CYAN,
  COLOR_PHASE_GREEN,
  COLOR_PHASE_YELLOW,
  type VoltageAmpTableRow,
} from '../data/voltageAmpReport'
import { useDetailContext } from '../context'

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

const VOLTAGE_BARS = [
  { dataKey: 'p1', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_GREEN, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_PHASE_YELLOW, label: 'Phase 3' },
] as const

const AMP_BARS = [
  { dataKey: 'p1', color: COLOR_VOLTAGE_CYAN, label: 'Phase 1' },
  { dataKey: 'p2', color: COLOR_PHASE_GREEN, label: 'Phase 2' },
  { dataKey: 'p3', color: COLOR_AMP_ORANGE, label: 'Phase 3' },
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
    <p className='fs-12 text-white mb-0'>{label}</p>
  </div>
)

const cyanCell = (value: string | number) => (
  <span style={{ color: COLOR_VOLTAGE_CYAN }}>{value}</span>
)

const SummaryReportSection: React.FC = () => {
  const { imei } = useDetailContext()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(DEFAULT_DATE_RANGE)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('DAILY')
  const [rows, setRows] = useState<ElectricityAggItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    const start = dateRange?.[0]?.format('YYYY-MM-DD')
    const end = dateRange?.[1]?.format('YYYY-MM-DD')
    getLightingElectricityAPI(imei, {
      start_date: start,
      end_date: end,
      report_type: REPORT_TYPE_MAP[reportPeriod],
      sort: 'ASC',
    })
      .then((res) => { if (active) setRows(res.data?.res_data ?? []) })
      .catch((err) => console.error('electricity failed:', err))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei, dateRange, reportPeriod])

  // Derive chart + table data from the API rows. Each row has a `phases[]`
  // array (phase 1/2/3); we flatten to per-row {p1, p2, p3} for the charts
  // and average the phases for the table row.
  const voltageChartData: BarChartDataPoint[] = useMemo(
    () => rows.map((r) => {
      const p1 = r.phases.find((p) => p.phase === '1')
      const p2 = r.phases.find((p) => p.phase === '2')
      const p3 = r.phases.find((p) => p.phase === '3')
      return {
        label: r.label,
        p1: p1?.voltage ?? 0,
        p2: p2?.voltage ?? 0,
        p3: p3?.voltage ?? 0,
      }
    }),
    [rows],
  )
  const ampChartData: BarChartDataPoint[] = useMemo(
    () => rows.map((r) => {
      const p1 = r.phases.find((p) => p.phase === '1')
      const p2 = r.phases.find((p) => p.phase === '2')
      const p3 = r.phases.find((p) => p.phase === '3')
      return {
        label: r.label,
        p1: p1?.amplitude ?? 0,
        p2: p2?.amplitude ?? 0,
        p3: p3?.amplitude ?? 0,
      }
    }),
    [rows],
  )

  const tableRows: VoltageAmpTableRow[] = useMemo(
    () => rows.map((r, i) => {
      // Average across phases for the headline numbers.
      const avg = (sel: (p: typeof r.phases[number]) => number) => {
        if (!r.phases.length) return 0
        return r.phases.reduce((s, p) => s + sel(p), 0) / r.phases.length
      }
      return {
        key: `${r.label}-${i}`,
        date: r.label,
        voltage: avg((p) => p.voltage),
        amp: avg((p) => p.amplitude),
        watt: avg((p) => p.watt),
        powerFactor: avg((p) => p.power_factor),
        kwh: 0, // not provided by the aggregated API
        frequency: avg((p) => p.frequency),
      }
    }),
    [rows],
  )

  const averages = useMemo(() => {
    const avg = (sel: (r: VoltageAmpTableRow) => number) =>
      tableRows.length ? tableRows.reduce((s, r) => s + sel(r), 0) / tableRows.length : 0
    return {
      voltage: avg((r) => r.voltage),
      amp: avg((r) => r.amp),
      watt: avg((r) => r.watt),
      powerFactor: avg((r) => r.powerFactor),
      kwh: avg((r) => r.kwh),
      frequency: avg((r) => r.frequency),
    }
  }, [tableRows])

  const columns: ColumnsType<VoltageAmpTableRow> = useMemo(
    () => [
      {
        title: 'วันที่',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
        width: 140,
        render: (value: string) => <span className='text-white'>{value}</span>,
      },
      {
        title: 'แรงดันไฟฟ้า (V)',
        dataIndex: 'voltage',
        key: 'voltage',
        align: 'center',
        width: 130,
        render: (value: number) => cyanCell(value.toFixed(2)),
      },
      {
        title: 'กระแสไฟฟ้า (A)',
        dataIndex: 'amp',
        key: 'amp',
        align: 'center',
        width: 120,
        render: (value: number) => cyanCell(value.toFixed(2)),
      },
      {
        title: 'กำลังไฟฟ้า (W)',
        dataIndex: 'watt',
        key: 'watt',
        align: 'center',
        width: 120,
        render: (value: number) => cyanCell(value.toFixed(2)),
      },
      {
        title: 'Power Factor',
        dataIndex: 'powerFactor',
        key: 'powerFactor',
        align: 'center',
        width: 110,
        render: (value: number) => cyanCell(value.toFixed(2)),
      },
      {
        title: 'พลังงานไฟฟ้าที่ใช้ไป (kWh)',
        dataIndex: 'kwh',
        key: 'kwh',
        align: 'center',
        width: 170,
        render: (value: number) => cyanCell(value === 0 ? '-' : value.toFixed(2)),
      },
      {
        title: 'ความถี่ (Hz)',
        dataIndex: 'frequency',
        key: 'frequency',
        align: 'center',
        width: 110,
        render: (value: number) => cyanCell(value.toFixed(2)),
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
          <span style={white}>{loaded ? averages.voltage.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align='center'>
          <span style={white}>{loaded ? averages.amp.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align='center'>
          <span style={white}>{loaded ? averages.watt.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} align='center'>
          <span style={white}>{loaded ? averages.powerFactor.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align='center'>
          <span style={white}>-</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={6} align='center'>
          <span style={white}>{loaded ? averages.frequency.toFixed(2) : '-'}</span>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    )
  }

  return (
    <div className='flex flex-col gap-4 pb-5'>
      <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
        แผนภูมิและตารางแสดงค่ากระแสไฟฟ้าและแรงดันไฟฟ้า
      </h3>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BarChart
            {...SHARED_CHART_PROPS}
            title='แผนภูมิแสดงค่าการทำงานของตู้ควบคุมไฟ (Volt)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_VOLTAGE_CYAN}
            data={voltageChartData}
            bars={[...VOLTAGE_BARS]}
            footer={
              <AvgFooter
                value={loaded ? `${averages.voltage.toFixed(2)} V` : '-'}
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
            bars={[...AMP_BARS]}
            footer={
              <AvgFooter
                value={loaded ? `${averages.amp.toFixed(2)} A` : '-'}
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
              size='small'
              icon={<TbPrinter />}
              onClick={() => alert('TODO: นำออกเอกสาร')}
              className='w-[130px]! h-[27px]! rounded-[88px]! px-2! text-xs! inline-flex! items-center! justify-center!'
            >
              นำออกเอกสาร
            </Button>
          </ConfigProvider>
        </div>
      </div>

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<VoltageAmpTableRow>
          rowKey='key'
          columns={columns}
          dataSource={tableRows}
          pagination={false}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{ emptyText: loaded ? 'ไม่พบข้อมูล' : 'กำลังโหลด...' }}
          summary={tableSummary}
        />
      </div>
    </div>
  )
}

export default React.memo(SummaryReportSection)
