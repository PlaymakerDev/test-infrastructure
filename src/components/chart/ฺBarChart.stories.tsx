import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { TbMapPin, TbTruck, TbAlertTriangle } from 'react-icons/tb'
import BarChart, { BarChartDataPoint, BarConfig } from './ฺBarchart'

// ── Sample data ───────────────────────────────────────────────────────────────

const weeklyData: BarChartDataPoint[] = [
  { label: 'จ.\n27/03', total: 1050, overweight: 80 },
  { label: 'อ.\n28/03', total: 570, overweight: 60 },
  { label: 'พ.\n29/03', total: 760, overweight: 120 },
  { label: 'พฤ.\n30/03', total: 410, overweight: 20 },
  { label: 'ศ.\n31/03', total: 900, overweight: 10 },
  { label: 'ส.\n01/04', total: 650, overweight: 40 },
  { label: 'อ.\n02/04', total: 420, overweight: 15 },
]

const monthlyData: BarChartDataPoint[] = [
  { label: 'ม.ค.', total: 12400, overweight: 940 },
  { label: 'ก.พ.', total: 10800, overweight: 720 },
  { label: 'มี.ค.', total: 13200, overweight: 1100 },
  { label: 'เม.ย.', total: 9500, overweight: 680 },
  { label: 'พ.ค.', total: 11300, overweight: 850 },
  { label: 'มิ.ย.', total: 10200, overweight: 790 },
]

const singleSeriesData: BarChartDataPoint[] = [
  { label: 'จ.\n27/03', incidents: 12 },
  { label: 'อ.\n28/03', incidents: 8 },
  { label: 'พ.\n29/03', incidents: 15 },
  { label: 'พฤ.\n30/03', incidents: 5 },
  { label: 'ศ.\n31/03', incidents: 20 },
  { label: 'ส.\n01/04', incidents: 9 },
  { label: 'อ.\n02/04', incidents: 11 },
]

const wimBars: BarConfig[] = [
  { dataKey: 'total', color: '#66AEFF', label: 'รถเข้าซั่งทั้งหมด' },
  { dataKey: 'overweight', color: '#FCD116', label: 'รถน้ำหนักเกิน' },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Chart/BarChart',
  component: BarChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#0f172a', padding: 32, borderRadius: 12, minHeight: 420 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'ชื่อหัวข้อ (required)',
    },
    subtitle: {
      control: 'text',
      description: 'คำอธิบายใต้ title',
    },
    icon: {
      control: false,
      description: 'React element แสดงด้านซ้ายของ title',
    },
    data: {
      control: 'object',
      description: 'ข้อมูลกราฟ — แต่ละ object ต้องมี key `label` และ key ที่ตรงกับ bars[].dataKey',
    },
    bars: {
      control: 'object',
      description: 'กำหนด bar แต่ละชุด { dataKey, color, label }',
    },
    periods: {
      control: 'object',
      description: 'ตัวเลือก tab period — ถ้าไม่ส่งจะไม่แสดง tab',
    },
    defaultPeriod: {
      control: 'text',
      description: 'period ที่ active เริ่มต้น',
    },
    onPeriodChange: {
      action: 'onPeriodChange',
      description: 'callback เมื่อผู้ใช้เปลี่ยน period tab',
    },
    height: {
      control: { type: 'range', min: 160, max: 500, step: 20 },
      description: 'ความสูง chart (px) — default 280',
    },
    yAxisTicks: {
      control: 'object',
      description: 'กำหนด ticks บน Y-axis เช่น [0, 200, 400, 600]',
    },
    yAxisDomain: {
      control: 'object',
      description: 'domain ของ Y-axis เช่น [0, 1200] หรือ [0, "auto"]',
    },
  },
  args: {
    onPeriodChange: fn(),
  },
} satisfies Meta<typeof BarChart>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * การแสดงผลหลัก — 2 series พร้อม period tab และ glow effect
 * ใช้เป็นแบบอ้างอิงหลักสำหรับ WIM station
 */
export const Default: Story = {
  args: {
    title: 'สถานีตรวจสอบน้ำหนัก',
    subtitle: 'สถิติผลการตรวจสอบน้ำหนัก',
    icon: <TbMapPin className='text-yellow-400' size={20} />,
    data: weeklyData,
    bars: wimBars,
    periods: ['วัน', 'เดือน', 'ปี'],
    defaultPeriod: 'วัน',
    yAxisTicks: [0, 200, 400, 600, 800, 1000, 1200],
    yAxisDomain: [0, 1200],
  },
}

/**
 * ข้อมูลรายเดือน — Y-axis ปรับ auto ตาม scale ข้อมูล
 */
export const MonthlyData: Story = {
  name: 'Monthly Data',
  args: {
    title: 'สถานีตรวจสอบน้ำหนัก',
    subtitle: 'สถิติรายเดือน',
    icon: <TbTruck className='text-yellow-400' size={20} />,
    data: monthlyData,
    bars: wimBars,
    periods: ['วัน', 'เดือน', 'ปี'],
    defaultPeriod: 'เดือน',
    yAxisDomain: [0, 'auto'],
  },
}

/**
 * 1 series — ทดสอบ layout เมื่อมี bar ชุดเดียวและสีต่างออกไป
 */
export const SingleSeries: Story = {
  name: 'Single Series',
  args: {
    title: 'อุบัติเหตุบนท้องถนน',
    subtitle: 'จำนวนอุบัติเหตุรายวัน',
    icon: <TbAlertTriangle className='text-yellow-400' size={20} />,
    data: singleSeriesData,
    bars: [{ dataKey: 'incidents', color: '#ef4444', label: 'อุบัติเหตุ' }],
    periods: ['วัน', 'เดือน', 'ปี'],
    defaultPeriod: 'วัน',
    yAxisDomain: [0, 'auto'],
  },
}

/**
 * ไม่มี period tab — widget แบบ static ไม่ให้ผู้ใช้เปลี่ยน period
 */
export const NoPeriodTabs: Story = {
  name: 'No Period Tabs',
  args: {
    title: 'สถานีตรวจสอบน้ำหนัก',
    subtitle: 'สถิติผลการตรวจสอบน้ำหนัก',
    icon: <TbMapPin className='text-yellow-400' size={20} />,
    data: weeklyData,
    bars: wimBars,
  },
}

/**
 * ไม่มี icon และ subtitle — header เรียบง่ายที่สุด
 */
export const TitleOnly: Story = {
  name: 'Title Only',
  args: {
    title: 'สถิติน้ำหนักรถ',
    data: weeklyData,
    bars: [{ dataKey: 'total', color: '#3b82f6', label: 'รถเข้าซั่งทั้งหมด' }],
    periods: ['วัน', 'เดือน'],
    defaultPeriod: 'วัน',
  },
}

/**
 * ความสูง chart 180px — widget ขนาดเล็กสำหรับ dashboard ที่มีพื้นที่จำกัด
 */
export const CompactHeight: Story = {
  name: 'Compact Height (180px)',
  args: {
    title: 'สถานีตรวจสอบน้ำหนัก',
    subtitle: 'สถิติผลการตรวจสอบน้ำหนัก',
    icon: <TbMapPin className='text-yellow-400' size={20} />,
    data: weeklyData,
    bars: wimBars,
    periods: ['วัน', 'เดือน', 'ปี'],
    defaultPeriod: 'วัน',
    height: 180,
  },
}
