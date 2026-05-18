"use client"
import React from 'react'
import { TbMapPin, TbTruck, TbClockHour4, TbGauge } from 'react-icons/tb'
import BarChart, { BarChartDataPoint, BarConfig } from '@/components/chart/Barchart'
import PieChart, { PieChartDataPoint } from '@/components/chart/PieChart'
import LineChart, { LineChartDataPoint, LineConfig, LineChartStat } from '@/components/chart/LineChart'
import GaugeChart, { GaugeTableRow } from '@/components/chart/GaugeChart'
import PieChartAll, { DonutStatusItem } from '@/components/chart/PieChartAll'

// ── BarChart data ─────────────────────────────────────────────────────────────

const barData: BarChartDataPoint[] = [
  { label: 'จ.\n27/03', total: 1050, overweight: 80 },
  { label: 'อ.\n28/03', total: 570, overweight: 60 },
  { label: 'พ.\n29/03', total: 760, overweight: 120 },
  { label: 'พฤ.\n30/03', total: 410, overweight: 20 },
  { label: 'ศ.\n31/03', total: 900, overweight: 10 },
  { label: 'ส.\n01/04', total: 650, overweight: 40 },
  { label: 'อ.\n02/04', total: 420, overweight: 15 },
]

const bars: BarConfig[] = [
  { dataKey: 'total', color: '#66AEFF', label: 'รถเข้าซั่งทั้งหมด' },
  { dataKey: 'overweight', color: '#FCD116', label: 'รถน้ำหนักเกิน' },
]

// ── PieChart data ─────────────────────────────────────────────────────────────

const pieData: PieChartDataPoint[] = [
  { name: 'รถบรรทุกส่วนบุคคล', value: 515208, color: '#22d3ee' },
  { name: 'รถบรรทุกไม่ประจำทาง', value: 235138, color: '#a855f7' },
  { name: 'รถโดยสารไม่ประจำทาง', value: 165109, color: '#FCD116' },
  { name: 'รถโดยสารประจำทาง', value: 37934, color: '#22c55e' },
  { name: 'ไม่ประบุประเภท', value: 0, color: '#3b82f6' },
]

// ── LineChart data ────────────────────────────────────────────────────────────

const lineData: LineChartDataPoint[] = [
  { label: '00.00', incidents: 4200, forecast: 3 },
  { label: '02.00', incidents: 3800, forecast: 2 },
  { label: '04.00', incidents: 4600, forecast: 4 },
  { label: '06.00', incidents: 7200, forecast: 6 },
  { label: '08.00', incidents: 9600, forecast: 8 },
  { label: '10.00', incidents: 8100, forecast: 7 },
  { label: '12.00', incidents: 7400, forecast: 6 },
  { label: '14.00', incidents: 6200, forecast: 5 },
  { label: '16.00', incidents: 5800, forecast: 5 },
  { label: '18.00', incidents: 7100, forecast: 6 },
  { label: '20.00', incidents: 6500, forecast: 5 },
  { label: '22.00', incidents: 4800, forecast: 4 },
  { label: '24.00', incidents: 2400, forecast: 2 },
]

const lineLines: LineConfig[] = [
  { dataKey: 'incidents', color: '#39ff14', label: 'แจ้งเตือนอุบัติการณ์' },
  { dataKey: 'forecast', color: '#ff4444', label: 'คาดการณ์การเกิดเหตุ' },
]

const lineStats: LineChartStat[] = [
  { value: 58083, label: 'แจ้งเตือนจำนวนอุบัติการณ์ (ครั้ง)', color: '#39ff14' },
  { value: 28, label: 'คาดการณ์การเกิดเหตุ (จุด)', color: '#ff4444' },
]

// ── PieChartAll data ──────────────────────────────────────────────────────────

const statusItems: DonutStatusItem[] = [
  { label: 'CCTV', value: 73, color: '#F4694E' },
  { label: 'Traffic\nSignal', value: 67, color: '#FFA94D' },
  { label: 'Lighting', value: 63, color: '#C8E045' },
  { label: 'VMS', value: 84, color: '#52E04D' },
  { label: 'WIM', value: 64, color: '#22D3BB' },
  { label: 'CrossWalk', value: 58, color: '#64D8F5' },
  { label: 'Tunnel', value: 32, color: '#818CF8' },
]

// ── GaugeChart data ───────────────────────────────────────────────────────────

const gaugeRows: GaugeTableRow[] = [
  { time: '12.00 น.', value: 79.00, highlighted: true },
  { time: '11.00 น.', value: 77.69 },
  { time: '10.00 น.', value: 78.79 },
  { time: '09.00 น.', value: 76.84 },
  { time: '08.00 น.', value: 74.84 },
]

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props { }

const TestScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='p-5 max-w-4xl flex flex-col gap-5'>
      <div
        className='rounded-2xl p-6'
        style={{ background: '#111111' }}
      >
        <PieChartAll items={statusItems} size={120} />
      </div>

      <BarChart
        title='สถานีตรวจสอบน้ำหนัก'
        subtitle='สถิติผลการตรวจสอบน้ำหนัก'
        icon={<TbMapPin className='text-yellow-400' size={20} />}
        data={barData}
        bars={bars}
        periods={['วัน', 'เดือน', 'ปี']}
        defaultPeriod='วัน'
        yAxisTicks={[0, 200, 400, 600, 800, 1000, 1200]}
        yAxisDomain={[0, 1200]}
      />

      <PieChart
        title='ประเภทยานพาหนะในระบบ'
        icon={<TbTruck className='text-yellow-400' size={20} />}
        data={pieData}
        centerLabel='ยานพาหนะรวมทั้งหมด'
        centerUnit='คัน'
        periods={['วันนี้', 'เดือน', 'ปี']}
        defaultPeriod='วันนี้'
      />

      <LineChart
        title='คาดการณ์แนวโน้มการเกิดอุบัติเหตุ'
        subtitle='เปรียบเทียบจำนวนแจ้งเตือนอุบัติการณ์และคาดการณ์'
        icon={<TbClockHour4 className='text-yellow-400' size={20} />}
        data={lineData}
        lines={lineLines}
        stats={lineStats}
        periods={['วันนี้', 'เดือน', 'ปี']}
        defaultPeriod='วันนี้'
        yAxisTicks={[0, 2000, 4000, 6000, 8000, 10000, 12000]}
        yAxisDomain={[0, 12000]}
      />

      <GaugeChart
        title='ความเร็วเฉลี่ยวันนี้'
        icon={<TbGauge className='text-yellow-400' size={20} />}
        value={76.59}
        unit='กม./ชม.'
        min={0}
        max={120}
        tableTitle='ความเร็วเฉลี่ยรายชั่วโมง'
        tableTimeLabel='เวลา'
        tableValueLabel='ความเร็วเฉลี่ย'
        tableRows={gaugeRows}
      />
    </div>
  )
}

export default React.memo<Props>(TestScreen)
