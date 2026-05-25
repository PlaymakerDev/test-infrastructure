import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TbGauge, TbCar } from 'react-icons/tb'
import GaugeChart, { GaugeTableRow } from './GaugeChart'

// ── Sample data ───────────────────────────────────────────────────────────────

const speedRows: GaugeTableRow[] = [
  { time: '06:00', value: 78.5 },
  { time: '07:00', value: 82.1 },
  { time: '08:00', value: 91.4 },
  { time: '09:00', value: 88.7 },
  { time: '10:00', value: 95.2, highlighted: true },
  { time: '11:00', value: 87.3 },
  { time: '12:00', value: 76.0 },
]

const volumeRows: GaugeTableRow[] = [
  { time: '06:00', value: 320.0 },
  { time: '07:00', value: 480.5 },
  { time: '08:00', value: 610.2, highlighted: true },
  { time: '09:00', value: 540.8 },
  { time: '10:00', value: 430.1 },
  { time: '11:00', value: 390.7 },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Chart/GaugeChart',
  component: GaugeChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#0f172a', padding: 32, borderRadius: 12, minHeight: 360 }}>
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
    value: {
      control: { type: 'range', min: 0, max: 200, step: 1 },
      description: 'ค่าปัจจุบันที่แสดงบน gauge',
    },
    unit: {
      control: 'text',
      description: 'หน่วยแสดงใต้ตัวเลข เช่น "กม./ชม."',
    },
    min: {
      control: { type: 'number' },
      description: 'ค่าต่ำสุดของ gauge (default 0)',
    },
    max: {
      control: { type: 'number' },
      description: 'ค่าสูงสุดของ gauge (default 120)',
    },
    tableTitle: {
      control: 'text',
      description: 'ชื่อหัวตาราง ด้านขวาของ gauge',
    },
    tableTimeLabel: {
      control: 'text',
      description: 'label คอลัมน์เวลา (default "เวลา")',
    },
    tableValueLabel: {
      control: 'text',
      description: 'label คอลัมน์ค่า (default "ความเร็วเฉลี่ย")',
    },
    tableRows: {
      control: 'object',
      description: 'แถวข้อมูลในตาราง { time, value, unit?, highlighted? }',
    },
    height: {
      control: { type: 'range', min: 160, max: 400, step: 20 },
      description: 'ความสูง gauge canvas (px) — default 270',
    },
  },
} satisfies Meta<typeof GaugeChart>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * การแสดงผลหลัก — gauge ความเร็ว พร้อมตารางบันทึกรายชั่วโมง
 */
export const Default: Story = {
  args: {
    title: 'ความเร็วเฉลี่ย',
    icon: <TbGauge className='text-yellow-400' size={20} />,
    value: 95.2,
    unit: 'กม./ชม.',
    min: 0,
    max: 120,
    tableTitle: 'บันทึกรายชั่วโมง',
    tableTimeLabel: 'เวลา',
    tableValueLabel: 'ความเร็วเฉลี่ย',
    tableRows: speedRows,
  },
}

/**
 * ค่าต่ำ — ทดสอบ gauge เมื่อ value อยู่ใกล้ min (แถบสีสั้น)
 */
export const LowValue: Story = {
  name: 'Low Value',
  args: {
    title: 'ความเร็วเฉลี่ย',
    icon: <TbGauge className='text-yellow-400' size={20} />,
    value: 22.5,
    unit: 'กม./ชม.',
    min: 0,
    max: 120,
    tableTitle: 'บันทึกรายชั่วโมง',
    tableTimeLabel: 'เวลา',
    tableValueLabel: 'ความเร็วเฉลี่ย',
    tableRows: [
      { time: '06:00', value: 20.1 },
      { time: '07:00', value: 22.5, highlighted: true },
      { time: '08:00', value: 18.3 },
    ],
  },
}

/**
 * ช่วงค่ากว้าง — max 200 สำหรับ domain ที่ต้องการ range ใหญ่กว่าปกติ
 */
export const WideRange: Story = {
  name: 'Wide Range (0–200)',
  args: {
    title: 'ปริมาณการจราจร',
    icon: <TbCar className='text-yellow-400' size={20} />,
    value: 610.2,
    unit: 'คัน/ชม.',
    min: 0,
    max: 800,
    tableTitle: 'บันทึกรายชั่วโมง',
    tableTimeLabel: 'เวลา',
    tableValueLabel: 'ปริมาณรถ',
    tableRows: volumeRows,
  },
}

/**
 * ไม่มีตาราง — แสดง gauge เพียงอย่างเดียว layout เต็มความกว้าง
 */
export const NoTable: Story = {
  name: 'No Table',
  args: {
    title: 'ความเร็วเฉลี่ย',
    icon: <TbGauge className='text-yellow-400' size={20} />,
    value: 78.0,
    unit: 'กม./ชม.',
    min: 0,
    max: 120,
    tableRows: [],
  },
}

/**
 * ไม่มี icon — header เรียบง่ายไม่มีวงกลม accent
 */
export const NoIcon: Story = {
  name: 'No Icon',
  args: {
    title: 'ความเร็วเฉลี่ย',
    value: 55.0,
    unit: 'กม./ชม.',
    min: 0,
    max: 120,
    tableTitle: 'บันทึกรายชั่วโมง',
    tableRows: speedRows,
  },
}

/**
 * ความสูง canvas 180px — widget ขนาดเล็กสำหรับ dashboard ที่มีพื้นที่จำกัด
 */
export const CompactHeight: Story = {
  name: 'Compact Height (180px)',
  args: {
    title: 'ความเร็วเฉลี่ย',
    icon: <TbGauge className='text-yellow-400' size={20} />,
    value: 95.2,
    unit: 'กม./ชม.',
    min: 0,
    max: 120,
    tableTitle: 'บันทึกรายชั่วโมง',
    tableRows: speedRows,
    height: 180,
  },
}
