import Barchart from '@/components/chart/Barchart'
import LineChart from '@/components/chart/LineChart'
import { Col, Row } from 'antd'
import React from 'react'
import { TbArrowsExchange, TbClockBolt, TbFlag, TbMapPin, TbUserCheck } from 'react-icons/tb'

interface Props { }

// ── Shared bar config ─────────────────────────────────────────────────────────
const BARS_WIM = [
  { color: '#66AEFF', dataKey: 'total',      label: 'รถเข้าชั่งทั้งหมด'    },
  { color: '#E94C4C', dataKey: 'overweight', label: 'รถเข้าชั่งน้ำหนักเกิน' },
]

// ── Bar chart data ────────────────────────────────────────────────────────────
const DATA_DAILY = [
  { label: 'อ.\n27/03',  total: 850, overweight: 200 },
  { label: 'อ.\n28/03',  total: 575, overweight: 100 },
  { label: 'พ.\n29/03',  total: 760, overweight: 120 },
  { label: 'พฤ.\n30/03', total: 405, overweight:  30 },
  { label: 'ศ.\n31/03',  total: 905, overweight:  15 },
  { label: 'ส.\n01/04',  total: 634, overweight:   1 },
  { label: 'อา.\n02/04', total: 420, overweight:  10 },
]

const DATA_MONTHLY = [
  { label: 'พ.ค.',  total: 480000, overweight: 12000 },
  { label: 'มิ.ย.', total: 460000, overweight: 10500 },
  { label: 'ก.ค.',  total: 510000, overweight: 14000 },
  { label: 'ส.ค.',  total: 420000, overweight:  9800 },
  { label: 'ก.ย.',  total: 380000, overweight:  8500 },
  { label: 'ต.ค.',  total: 430000, overweight: 11000 },
  { label: 'พ.ย.',  total: 400000, overweight:  9200 },
  { label: 'ธ.ค.',  total: 300000, overweight:  7500 },
  { label: 'ก.พ.',  total: 470000, overweight: 13000 },
  { label: 'มี.ค.', total: 495000, overweight: 13800 },
  { label: 'เม.ย.', total: 410000, overweight:  9600 },
]

const DATA_YEARLY = [
  { label: '2560', total: 400000, overweight: 18000 },
  { label: '2561', total: 450000, overweight: 21000 },
  { label: '2562', total: 530000, overweight: 26000 },
  { label: '2563', total: 455000, overweight: 20000 },
  { label: '2564', total: 350000, overweight: 14000 },
  { label: '2565', total: 385000, overweight: 16000 },
  { label: '2566', total: 445000, overweight: 19500 },
  { label: '2567', total: 560000, overweight: 28000 },
  { label: '2568', total: 480000, overweight: 22000 },
  { label: '2569', total: 230000, overweight:  9000 },
]

// ── Line chart data ───────────────────────────────────────────────────────────
const DATA_10Y_TREND = [
  { label: '2560', station:  520000, wim: 1200000, mobile: 180000 },
  { label: '2561', station:  680000, wim: 1800000, mobile: 200000 },
  { label: '2562', station:  820000, wim: 2200000, mobile: 195000 },
  { label: '2563', station:  600000, wim: 1500000, mobile: 150000 },
  { label: '2564', station:  490000, wim: 1200000, mobile: 100000 },
  { label: '2565', station:  610000, wim: 1900000, mobile:  78000 },
  { label: '2566', station:  750000, wim: 2500000, mobile:  70000 },
  { label: '2567', station:  852201, wim: 2492853, mobile:  61374 },
  { label: '2568', station:  750000, wim: 2800000, mobile:  95000 },
  { label: '2569', station:  620000, wim: 2000000, mobile: 190000 },
]

const DATA_ACCIDENT_HOURLY = [
  { label: '00.00', incidents: 1800, predicted:  400 },
  { label: '02.00', incidents:  900, predicted:  200 },
  { label: '04.00', incidents:  600, predicted:  150 },
  { label: '06.00', incidents:  500, predicted:  120 },
  { label: '08.00', incidents: 1200, predicted:  280 },
  { label: '10.00', incidents: 2000, predicted:  450 },
  { label: '12.00', incidents: 3500, predicted:  750 },
  { label: '14.00', incidents: 4500, predicted:  900 },
  { label: '16.00', incidents: 5800, predicted: 1100 },
  { label: '18.00', incidents: 7200, predicted: 1300 },
  { label: '20.00', incidents: 8047, predicted: 1045 },
  { label: '22.00', incidents: 5000, predicted:  700 },
  { label: '24.00', incidents: 3000, predicted:  400 },
]

const ChartSection: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      {/* ── Bar charts ──────────────────────────────────────────────────────── */}
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8} xxxl={8}>
        <Barchart
          title='สถานีตรวจสอบน้ำหนัก'
          subtitle='สถิติผลการตรวจสอบน้ำหนัก'
          icon={<TbMapPin className='fs-22 shrink-0' />}
          iconCircle={false}
          bars={BARS_WIM}
          data={DATA_DAILY}
          periods={['วัน', 'เดือน', 'ปี']}
          defaultPeriod='วัน'
          onPeriodChange={() => { }}
          yAxisTicks={[0, 200, 400, 600, 800, 1000, 1200]}
          yAxisDomain={[0, 1200]}
          cardBorderColor='transparent'
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8} xxxl={8}>
        <Barchart
          title='WIM (Weigh-In-Motion)'
          subtitle='สถิติผลการตรวจสอบน้ำหนัก'
          icon={<TbFlag className='fs-22 shrink-0' />}
          iconCircle={false}
          bars={BARS_WIM}
          data={DATA_MONTHLY}
          periods={['วัน', 'เดือน', 'ปี']}
          defaultPeriod='เดือน'
          onPeriodChange={() => { }}
          yAxisTicks={[0, 100000, 200000, 300000, 400000, 500000, 600000]}
          yAxisDomain={[0, 600000]}
          cardBorderColor='transparent'
        />
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8} xxxl={8}>
        <Barchart
          title='หน่วยตรวจสอบน้ำหนักเคลื่อนที่'
          subtitle='สถิติผลการตรวจสอบน้ำหนัก'
          icon={<TbUserCheck className='fs-22 shrink-0' />}
          iconCircle={false}
          bars={BARS_WIM}
          data={DATA_YEARLY}
          periods={['วัน', 'เดือน', 'ปี']}
          defaultPeriod='ปี'
          onPeriodChange={() => { }}
          yAxisTicks={[0, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000]}
          yAxisDomain={[0, 800000]}
          cardBorderColor='transparent'
        />
      </Col>

      {/* ── Line charts ─────────────────────────────────────────────────────── */}
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
        <LineChart
          title='แนวโน้มจำนวนรถเข้าชั่ง 10 ปีล่าสุด'
          subtitle='เปรียบเทียบเที่ยวรถเข้าชั่งตามสถานประเภท (สถานีตรวจสอบน้ำหนัก WIM และหน่วยตรวจสอบน้ำหนักเคลื่อนที่)'
          icon={<TbArrowsExchange size={18} />}
          iconCircle={false}
          accentColor='#66AEFF'
          cardBackground='#00000080'
          cardBorderColor='transparent'
          showGlow={false}
          data={DATA_10Y_TREND}
          lines={[
            { dataKey: 'station', color: '#FCD116', label: 'สถานีตรวจสอบน้ำหนัก' },
            { dataKey: 'wim',     color: '#4ADE80', label: 'WIM (Weigh-In-Motion)' },
            { dataKey: 'mobile',  color: '#E94C4C', label: 'หน่วยตรวจสอบน้ำหนักเคลื่อนที่' },
          ]}
          stats={[
            { value: '3,248,192', label: 'สถานีตรวจสอบน้ำหนัก',      color: '#FCD116' },
            { value: '7,123,975', label: 'WIM (Weigh-In-Motion)',      color: '#4ADE80' },
            { value: '98,124',    label: 'หน่วยตรวจสอบน้ำหนักเคลื่อนที่', color: '#E94C4C' },
          ]}
          yAxisDomain={[0, 3000000]}
          yAxisTicks={[0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000]}
          height={260}
          tooltipShowDot
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
        <LineChart
          title='คาดการณ์แนวโน้มการเกิดอุบัติเหตุ'
          subtitle='เปรียบเทียบจำนวนเที่ยวเดือนอุบัติการณ์ตามประเภทพาหนะ'
          icon={<TbClockBolt size={18} />}
          iconCircle={false}
          accentColor='#FFA94D'
          cardBackground='#00000080'
          cardBorderColor='transparent'
          showGlow={false}
          data={DATA_ACCIDENT_HOURLY}
          lines={[
            { dataKey: 'incidents', color: '#4ADE80', label: 'เส้นเดือนอุบัติการณ์' },
            { dataKey: 'predicted', color: '#E94C4C', label: 'คาดการณ์เกิดเหตุ'    },
          ]}
          stats={[
            { value: '58,083', label: 'เส้นเดือนอุบัติการณ์ (ครั้ง)', color: '#4ADE80' },
            { value: '28,834', label: 'คาดการณ์เกิดเหตุ (จุด)',       color: '#E94C4C' },
          ]}
          periods={['วันนี้', 'เดือน', 'ปี']}
          defaultPeriod='วันนี้'
          onPeriodChange={() => { }}
          yAxisDomain={[0, 12000]}
          yAxisTicks={[0, 2000, 4000, 6000, 8000, 10000, 12000]}
          height={260}
          tooltipShowDot
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ChartSection)
