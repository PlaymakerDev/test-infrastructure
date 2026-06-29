"use client"
import React from 'react'
import { Col, Row } from 'antd'
import { TbBulb, TbBolt } from 'react-icons/tb'
import BarChart from '@/components/chart/Barchart'
import LineChart from '@/components/chart/LineChart'
import { AMP_24H, LAMP_STATUS_7D } from '../data/lampCharts'

const CHART_CARD = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  accentColor: '#FCD116',
  height: 240,
} as const

const LampChartsSection: React.FC = () => (
  <section className='mt-4 w-full'>
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <BarChart
          {...CHART_CARD}
          title='แผนภูมิแสดงประวัติสถานะโคมไฟ 7 วันย้อนหลัง'
          icon={<TbBulb size={18} style={{ color: '#FCD116' }} />}
          data={LAMP_STATUS_7D}
          bars={[
            { dataKey: 'up', color: '#66AEFF', label: 'UP' },
            { dataKey: 'down', color: '#E94C4C', label: 'DOWN' },
          ]}
          yAxisTicks={[0, 100, 200, 300, 400, 500]}
          yAxisDomain={[0, 500]}
        />
      </Col>
      <Col xs={24} lg={12}>
        <LineChart
          {...CHART_CARD}
          title='กระแสไฟฟ้าเฉลี่ย 24 ชั่วโมงล่าสุด (Amp)'
          icon={<TbBolt size={18} style={{ color: '#FCD116' }} />}
          data={AMP_24H}
          lines={[{ dataKey: 'amp', color: '#FF5C8A', label: 'Avg Current' }]}
          yAxisTicks={[0, 20, 40, 60, 80, 100]}
          yAxisDomain={[0, 100]}
          tooltipDateKey='date'
          tooltipUnit='A'
          showGlow={false}
        />
      </Col>
    </Row>
  </section>
)

export default React.memo(LampChartsSection)
