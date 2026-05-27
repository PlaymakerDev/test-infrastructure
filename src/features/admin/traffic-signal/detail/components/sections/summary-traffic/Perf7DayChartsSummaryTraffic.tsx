"use client"
import React from 'react'
import { Col, Row } from 'antd'
import BarChart, { type BarChartDataPoint } from '@/components/chart/Barchart'

interface Props { }

// 7-day data: ศ/ส/อา/จ/อ/พ/พฤ (14/04 → 20/04)
const DAYS: BarChartDataPoint[] = [
  { label: 'ศ.\n14/04', pcu: 9000, efficiency: 92, et: 85, timeSaved: 18 },
  { label: 'ส.\n15/04', pcu: 8800, efficiency: 90, et: 88, timeSaved: 22 },
  { label: 'อา.\n16/04', pcu: 9784, efficiency: 88, et: 80, timeSaved: 30 },
  { label: 'จ.\n17/04', pcu: 5200, efficiency: 91, et: 82, timeSaved: 21 },
  { label: 'อ.\n18/04', pcu: 3700, efficiency: 89, et: 78, timeSaved: 38 },
  { label: 'พ.\n19/04', pcu: 4400, efficiency: 92, et: 90, timeSaved: 16 },
  { label: 'พฤ.\n20/04', pcu: 3000, efficiency: 86, et: 80, timeSaved: 28 },
]

/** Per-metric accent — used for title, bars, and avg footer border. */
const COLOR_PCU = '#66AEFF'
const COLOR_EFFICIENCY = '#6680FF'
const COLOR_ET = '#8C66FF'
const COLOR_TIME_SAVED = '#CA66FF'

/** Avg footer card — sits inside the BarChart's card via `footer` prop. */
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
    <p className='fs-12 text-gray-400 mb-0'>{label}</p>
  </div>
)

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  height: 220,
} as const

const Perf7DayChartsSummaryTraffic: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='ปริมาณจราจร (PCU) สูงสุดรายวัน'
          accentColor={COLOR_PCU}
          data={DAYS}
          bars={[{ dataKey: 'pcu', color: COLOR_PCU, label: 'PCU' }]}
          yAxisTicks={[0, 2000, 4000, 6000, 8000, 10000]}
          footer={<AvgFooter value='9,784.5' label='Avg Daily PCU' color={COLOR_PCU} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='ประสิทธิภาพการทำงานของระบบรายวัน'
          accentColor={COLOR_EFFICIENCY}
          data={DAYS}
          bars={[{ dataKey: 'efficiency', color: COLOR_EFFICIENCY, label: 'Efficiency' }]}
          yAxisTicks={[0, 20, 40, 60, 80, 100]}
          footer={<AvgFooter value='87%' label='Avg Efficiency' color={COLOR_EFFICIENCY} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='Early Termination Rate'
          accentColor={COLOR_ET}
          data={DAYS}
          bars={[{ dataKey: 'et', color: COLOR_ET, label: 'ET Rate' }]}
          yAxisTicks={[0, 20, 40, 60, 80, 100]}
          footer={<AvgFooter value='83%' label='Avg ET Rate' color={COLOR_ET} />}
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={6}>
        <BarChart
          {...SHARED_CHART_PROPS}
          title='เวลาที่ระบบช่วยประหยัด'
          accentColor={COLOR_TIME_SAVED}
          data={DAYS}
          bars={[{ dataKey: 'timeSaved', color: COLOR_TIME_SAVED, label: 'ชั่วโมง' }]}
          yAxisTicks={[0, 10, 20, 30, 40]}
          footer={<AvgFooter value='64.3h' label='Total Time Saved' color={COLOR_TIME_SAVED} />}
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(Perf7DayChartsSummaryTraffic)
