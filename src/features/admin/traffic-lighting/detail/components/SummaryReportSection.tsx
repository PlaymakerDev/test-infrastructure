"use client"
import React, { useMemo, useState } from 'react'
import { Button, Col, ConfigProvider, DatePicker, Row, Segmented, Table } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbBolt, TbPrinter } from 'react-icons/tb'
import BarChart from '@/components/chart/Barchart'
import useIsMobile from '@/utils/hooks/useIsMobile'
import {
  AMP_AVG,
  AMP_BARS,
  AMP_CHART_DATA,
  COLOR_AMP_ORANGE,
  COLOR_VOLTAGE_CYAN,
  VOLTAGE_AMP_TABLE_AVERAGES,
  VOLTAGE_AMP_TABLE_ROWS,
  VOLTAGE_AVG,
  VOLTAGE_BARS,
  VOLTAGE_CHART_DATA,
  type VoltageAmpTableRow,
} from '../data/voltageAmpReport'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const { RangePicker } = DatePicker

type ReportPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY'

const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs('2026-04-20'), dayjs('2026-04-26')]

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
  yAxisTicks: [0, 65, 130, 195, 260] as number[],
} as const

const AMP_CHART_PROPS = {
  ...SHARED_CHART_PROPS,
  yAxisTicks: [0, 1, 2, 3, 4] as number[],
}

const AvgFooter: React.FC<{ value: string; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div
    className='py-2 px-3 rounded-lg text-center'
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
  const isMobile = useIsMobile()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(DEFAULT_DATE_RANGE)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('DAILY')

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
        render: (value: number) => cyanCell(value.toFixed(2)),
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
    const avg = VOLTAGE_AMP_TABLE_AVERAGES
    const white = { color: '#FFFFFF', fontWeight: 600 } as const
    return (
      <Table.Summary.Row style={{ background: '#191919' }}>
        <Table.Summary.Cell index={0} align='center'>
          <span style={white}>รวมเฉลี่ย</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align='center'>
          <span style={white}>{avg.voltage.toFixed(2)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align='center'>
          <span style={white}>{avg.amp.toFixed(2)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align='center'>
          <span style={white}>{avg.watt.toFixed(2)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} align='center'>
          <span style={white}>{avg.powerFactor.toFixed(2)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align='center'>
          <span style={white}>{avg.kwh.toFixed(2)}</span>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={6} align='center'>
          <span style={white}>{avg.frequency.toFixed(2)}</span>
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
            data={VOLTAGE_CHART_DATA}
            bars={[...VOLTAGE_BARS]}
            footer={
              <AvgFooter
                value={`${VOLTAGE_AVG.toFixed(2)} V`}
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
            data={AMP_CHART_DATA}
            bars={[...AMP_BARS]}
            footer={
              <AvgFooter
                value={`${AMP_AVG.toFixed(2)} A`}
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
          dataSource={VOLTAGE_AMP_TABLE_ROWS}
          pagination={false}
          size='middle'
          className='bridge-projects-table event-log-table'
          locale={{ emptyText: 'ไม่พบข้อมูล' }}
          summary={tableSummary}
        />
      </div>
    </div>
  )
}

export default React.memo(SummaryReportSection)
