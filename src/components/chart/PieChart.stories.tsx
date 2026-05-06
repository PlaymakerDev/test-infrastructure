import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { TbTruck, TbCar, TbAlertTriangle } from 'react-icons/tb'
import PieChart, { PieChartDataPoint } from './PieChart'

// ── Sample data ───────────────────────────────────────────────────────────────

const vehicleData: PieChartDataPoint[] = [
  { name: 'รถบรรทุกส่วนบุคคล', value: 515208, color: '#22d3ee' },
  { name: 'รถบรรทุกไม่ประจำทาง', value: 235138, color: '#a855f7' },
  { name: 'รถโดยสารไม่ประจำทาง', value: 165109, color: '#FCD116' },
  { name: 'รถโดยสารประจำทาง', value: 37934, color: '#22c55e' },
  { name: 'ไม่ประบุประเภท', value: 0, color: '#3b82f6' },
]

const incidentData: PieChartDataPoint[] = [
  { name: 'อุบัติเหตุ', value: 142, color: '#ef4444' },
  { name: 'รถเสีย', value: 89, color: '#f97316' },
  { name: 'สิ่งกีดขวาง', value: 54, color: '#FCD116' },
  { name: 'น้ำท่วม', value: 23, color: '#3b82f6' },
]

const twoSeriesData: PieChartDataPoint[] = [
  { name: 'ปกติ', value: 980, color: '#22c55e' },
  { name: 'ผิดปกติ', value: 120, color: '#ef4444' },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Chart/PieChart',
  component: PieChart,
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
    icon: {
      control: false,
      description: 'React element แสดงด้านซ้ายของ title',
    },
    data: {
      control: 'object',
      description: 'ข้อมูลกราฟ — แต่ละ object ต้องมี name, value, color',
    },
    centerLabel: {
      control: 'text',
      description: 'ข้อความบรรทัดบนใน center donut',
    },
    centerUnit: {
      control: 'text',
      description: 'หน่วยใต้ตัวเลขใน center donut',
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
      control: { type: 'range', min: 160, max: 400, step: 20 },
      description: 'ความสูง donut chart (px) — default 280',
    },
  },
  args: {
    onPeriodChange: fn(),
  },
} satisfies Meta<typeof PieChart>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * การแสดงผลหลัก — ประเภทยานพาหนะในระบบ 5 ประเภท พร้อม period tab และ glow effect
 */
export const Default: Story = {
  args: {
    title: 'ประเภทยานพาหนะในระบบ',
    icon: <TbTruck className='text-yellow-400' size={20} />,
    data: vehicleData,
    centerLabel: 'ยานพาหนะรวมทั้งหมด',
    centerUnit: 'คัน',
    periods: ['วันนี้', 'เดือน', 'ปี'],
    defaultPeriod: 'วันนี้',
  },
}

/**
 * ข้อมูลประเภทอุบัติเหตุ — ทดสอบ legend และ tooltip เมื่อใช้กับ domain ต่างออกไป
 */
export const IncidentTypes: Story = {
  name: 'Incident Types',
  args: {
    title: 'ประเภทเหตุการณ์',
    icon: <TbAlertTriangle className='text-yellow-400' size={20} />,
    data: incidentData,
    centerLabel: 'เหตุการณ์ทั้งหมด',
    centerUnit: 'เหตุการณ์',
    periods: ['วันนี้', 'เดือน', 'ปี'],
    defaultPeriod: 'วันนี้',
  },
}

/**
 * 2 series — ทดสอบ donut ที่มีข้อมูลเพียง 2 ชุด เช่น ปกติ/ผิดปกติ
 */
export const TwoSeries: Story = {
  name: 'Two Series',
  args: {
    title: 'สถานะยานพาหนะ',
    icon: <TbCar className='text-yellow-400' size={20} />,
    data: twoSeriesData,
    centerLabel: 'ยานพาหนะทั้งหมด',
    centerUnit: 'คัน',
    periods: ['วันนี้', 'เดือน'],
    defaultPeriod: 'วันนี้',
  },
}

/**
 * ไม่มี period tab — widget แบบ static
 */
export const NoPeriodTabs: Story = {
  name: 'No Period Tabs',
  args: {
    title: 'ประเภทยานพาหนะในระบบ',
    icon: <TbTruck className='text-yellow-400' size={20} />,
    data: vehicleData,
    centerLabel: 'ยานพาหนะรวมทั้งหมด',
    centerUnit: 'คัน',
  },
}

/**
 * ไม่มี center text — ทดสอบ layout เมื่อไม่ต้องการแสดงข้อความตรงกลาง
 */
export const NoCenterText: Story = {
  name: 'No Center Text',
  args: {
    title: 'ประเภทยานพาหนะในระบบ',
    icon: <TbTruck className='text-yellow-400' size={20} />,
    data: vehicleData,
    periods: ['วันนี้', 'เดือน', 'ปี'],
    defaultPeriod: 'วันนี้',
  },
}

/**
 * ความสูง chart 200px — widget ขนาดเล็กสำหรับ dashboard ที่มีพื้นที่จำกัด
 */
export const CompactHeight: Story = {
  name: 'Compact Height (200px)',
  args: {
    title: 'ประเภทยานพาหนะในระบบ',
    icon: <TbTruck className='text-yellow-400' size={20} />,
    data: vehicleData,
    centerLabel: 'ยานพาหนะรวมทั้งหมด',
    centerUnit: 'คัน',
    periods: ['วันนี้', 'เดือน', 'ปี'],
    defaultPeriod: 'วันนี้',
    height: 200,
  },
}
