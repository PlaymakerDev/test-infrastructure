import { Col, Row } from 'antd'
import React from 'react'
import { TbCarCrash, TbAlertTriangle } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'

interface Props {}

const HOURS: LineChartDataPoint[] = [
  {
    label: '00.00',
    detected: 0,
    confirmed: 0,
    wrong_way: 0,
    stopped: 0,
  },
  {
    label: '03.00',
    detected: 1,
    confirmed: 0,
    wrong_way: 0,
    stopped: 1,
  },
  {
    label: '06.00',
    detected: 3,
    confirmed: 2,
    wrong_way: 1,
    stopped: 0,
  },
  {
    label: '09.00',
    detected: 8,
    confirmed: 5,
    wrong_way: 2,
    stopped: 3,
  },
  {
    label: '12.00',
    detected: 12,
    confirmed: 9,
    wrong_way: 3,
    stopped: 4,
  },
  {
    label: '15.00',
    detected: 10,
    confirmed: 7,
    wrong_way: 2,
    stopped: 5,
  },
  {
    label: '18.00',
    detected: 15,
    confirmed: 12,
    wrong_way: 4,
    stopped: 6,
  },
  {
    label: '21.00',
    detected: 6,
    confirmed: 4,
    wrong_way: 1,
    stopped: 2,
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
          title='สถิติการตรวจพบเหตุการณ์รายชั่วโมง'
          subtitle='เปรียบเทียบจำนวนเหตุการณ์ที่ตรวจพบและยืนยัน'
          icon={<TbCarCrash size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            {
              dataKey: 'detected',
              color: '#FF6B9D',
              label: 'ตรวจพบ',
            },
            {
              dataKey: 'confirmed',
              color: '#FFA500',
              label: 'ยืนยัน',
            },
          ]}
          stats={[
            {
              value: 55,
              label: 'จำนวนเหตุการณ์ที่ตรวจพบ',
              color: '#FF6B9D',
            },
            {
              value: 39,
              label: 'จำนวนเหตุการณ์ที่ยืนยัน',
              color: '#FFA500',
            },
          ]}
          yAxisTicks={[0, 4, 8, 12, 16]}
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
          title='สถิติประเภทเหตุการณ์ประจำวัน'
          subtitle='เปรียบเทียบประเภทเหตุการณ์แต่ละชั่วโมง'
          icon={<TbAlertTriangle size={20} />}
          accentColor='#ffffff'
          data={HOURS}
          lines={[
            {
              dataKey: 'wrong_way',
              color: '#E94C4C',
              label: 'ขับรถย้อนศร',
            },
            {
              dataKey: 'stopped',
              color: '#66AEFF',
              label: 'รถจอดกีดขวาง',
            },
          ]}
          stats={[
            {
              value: 13,
              label: 'ขับรถย้อนศร',
              color: '#E94C4C',
            },
            {
              value: 21,
              label: 'รถจอดกีดขวาง',
              color: '#66AEFF',
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
