import { Col, Row } from 'antd'
import React from 'react'
import { TbWalk, TbX } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'

interface Props { }

const HOURS: LineChartDataPoint[] = [
  { label: '00.00', pedestrian: 4, button: 0, person: 0, vehicle: 0 },
  { label: '01.00', pedestrian: 3, button: 0, person: 0, vehicle: 1 },
  { label: '02.00', pedestrian: 2, button: 0, person: 0, vehicle: 2 },
  { label: '03.00', pedestrian: 1, button: 0, person: 0, vehicle: 4 },
  { label: '04.00', pedestrian: 1, button: 0, person: 0, vehicle: 6 },
  { label: '05.00', pedestrian: 2, button: 1, person: 0, vehicle: 7 },
  { label: '06.00', pedestrian: 4, button: 1, person: 0, vehicle: 8 },
  { label: '07.00', pedestrian: 7, button: 2, person: 1, vehicle: 7 },
  { label: '08.00', pedestrian: 8, button: 2, person: 0, vehicle: 5 },
  { label: '09.00', pedestrian: 6, button: 2, person: 0, vehicle: 4 },
  { label: '10.00', pedestrian: 4, button: 2, person: 0, vehicle: 3 },
  { label: '11.00', pedestrian: 3, button: 2, person: 0, vehicle: 2 },
  { label: '12.00', pedestrian: 2, button: 1, person: 0, vehicle: 1 },
  { label: '13.00', pedestrian: 2, button: 1, person: 0, vehicle: 2 },
  { label: '14.00', pedestrian: 2, button: 2, person: 1, vehicle: 2 },
  { label: '15.00', pedestrian: 3, button: 2, person: 1, vehicle: 3 },
  { label: '16.00', pedestrian: 4, button: 1, person: 2, vehicle: 3 },
  { label: '17.00', pedestrian: 5, button: 0, person: 5, vehicle: 3 },
  { label: '18.00', pedestrian: 6, button: 0, person: 9, vehicle: 3 },
  { label: '19.00', pedestrian: 3, button: 0, person: 4, vehicle: 2 },
  { label: '20.00', pedestrian: 1, button: 0, person: 2, vehicle: 1 },
  { label: '21.00', pedestrian: 0, button: 0, person: 1, vehicle: 0 },
  { label: '22.00', pedestrian: 0, button: 0, person: 0, vehicle: 0 },
]

const ChartSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <LineChart
          title='สถิติคนข้ามและการกดปุ่มประจำวัน'
          subtitle='เปรียบเทียบจำนวนคนข้ามและการกดปุ่มรายชั่วโมง'
          icon={<TbWalk size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            { dataKey: 'pedestrian', color: '#00E5CC', label: 'คนข้าม' },
            { dataKey: 'button', color: '#B5FF3B', label: 'การกดปุ่ม' },
          ]}
          stats={[
            { value: 26, label: 'จำนวนคนข้าม (คน)', color: '#00E5CC' },
            { value: 13, label: 'จำนวนการกดปุ่ม (ครั้ง)', color: '#B5FF3B' },
          ]}
          yAxisTicks={[0, 2, 4, 6, 8]}
          tooltipDate='20 เม.ย. 2569'
          tooltipShowDot
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} xxxl={12}>
        <LineChart
          title='สถิติการฝ่าฝืนสัญญาณไฟทางข้ามประจำวัน'
          subtitle='เปรียบเทียบจำนวนคนข้ามและการกดปุ่มรายชั่วโมง'
          icon={<TbX size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            { dataKey: 'person', color: '#FF6B9D', label: 'คนฝ่าฝืนสัญญาณไฟ' },
            { dataKey: 'vehicle', color: '#FFA500', label: 'รถฝ่าฝืนสัญญาณไฟ' },
          ]}
          stats={[
            { value: 9, label: 'จำนวนคนฝ่าฝืนสัญญาณไฟทางข้าม', color: '#FF6B9D' },
            { value: 45, label: 'จำนวนรถฝ่าฝืนสัญญาณไฟทางข้าม', color: '#FFA500' },
          ]}
          yAxisTicks={[0, 3, 6, 9, 12]}
          tooltipDate='20 เม.ย. 2569'
          tooltipShowDot
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
