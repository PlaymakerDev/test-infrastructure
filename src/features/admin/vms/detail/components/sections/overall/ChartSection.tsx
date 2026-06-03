import { Col, Row } from 'antd'
import React from 'react'
import { TbDeviceDesktop, TbWifi } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'

interface Props {}

const HOURS: LineChartDataPoint[] = [
  {
    label: '00.00',
    online: 4,
    offline: 0,
    messages: 2,
    errors: 0,
  },
  {
    label: '03.00',
    online: 4,
    offline: 0,
    messages: 1,
    errors: 0,
  },
  {
    label: '06.00',
    online: 4,
    offline: 0,
    messages: 3,
    errors: 0,
  },
  {
    label: '09.00',
    online: 3,
    offline: 1,
    messages: 5,
    errors: 1,
  },
  {
    label: '12.00',
    online: 4,
    offline: 0,
    messages: 8,
    errors: 0,
  },
  {
    label: '15.00',
    online: 4,
    offline: 0,
    messages: 6,
    errors: 0,
  },
  {
    label: '18.00',
    online: 2,
    offline: 2,
    messages: 4,
    errors: 2,
  },
  {
    label: '21.00',
    online: 4,
    offline: 0,
    messages: 2,
    errors: 0,
  },
]

const ChartSection: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col
        xs={24}
        sm={24}
        md={12}
      >
        <LineChart
          title='สถานะป้าย VMS รายชั่วโมง'
          subtitle='เปรียบเทียบจำนวนป้าย Online/Offline'
          icon={<TbWifi size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            {
              dataKey: 'online',
              color: '#66AEFF',
              label: 'ออนไลน์',
            },
            {
              dataKey: 'offline',
              color: '#E94C4C',
              label: 'ออฟไลน์',
            },
          ]}
          stats={[
            {
              value: 4,
              label: 'ป้ายออนไลน์',
              color: '#66AEFF',
            },
            {
              value: 0,
              label: 'ป้ายออฟไลน์',
              color: '#E94C4C',
            },
          ]}
          yAxisTicks={[0, 1, 2, 3, 4]}
          tooltipDate='20 เม.ย. 2569'
          tooltipShowDot
        />
      </Col>
      <Col
        xs={24}
        sm={24}
        md={12}
      >
        <LineChart
          title='สถิติการส่งข้อความ VMS ประจำวัน'
          subtitle='จำนวนครั้งที่เปลี่ยนข้อความและข้อผิดพลาด'
          icon={<TbDeviceDesktop size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            {
              dataKey: 'messages',
              color: '#FCD116',
              label: 'เปลี่ยนข้อความ',
            },
            {
              dataKey: 'errors',
              color: '#FF6B9D',
              label: 'ข้อผิดพลาด',
            },
          ]}
          stats={[
            {
              value: 31,
              label: 'จำนวนการเปลี่ยนข้อความ',
              color: '#FCD116',
            },
            {
              value: 3,
              label: 'จำนวนข้อผิดพลาด',
              color: '#FF6B9D',
            },
          ]}
          yAxisTicks={[0, 2, 4, 6, 8]}
          tooltipDate='20 เม.ย. 2569'
          tooltipShowDot
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
