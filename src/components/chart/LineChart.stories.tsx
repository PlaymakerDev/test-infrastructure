import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { TbActivityHeartbeat, TbCar, TbAlertTriangle } from 'react-icons/tb'
import LineChart, { LineChartDataPoint, LineConfig, LineChartStat } from './LineChart'

// ── Sample data ───────────────────────────────────────────────────────────────

const hourlyData: LineChartDataPoint[] = [
  { label: '00', speed: 72, avg: 65 },
  { label: '02', speed: 68, avg: 65 },
  { label: '04', speed: 55, avg: 60 },
  { label: '06', speed: 80, avg: 70 },
  { label: '08', speed: 95, avg: 75 },
  { label: '10', speed: 88, avg: 72 },
  { label: '12', speed: 76, avg: 68 },
  { label: '14', speed: 82, avg: 70 },
  { label: '16', speed: 91, avg: 74 },
  { label: '18', speed: 100, avg: 78 },
  { label: '20', speed: 85, avg: 72 },
  { label: '22', speed: 70, avg: 66 },
]

const incidentData: LineChartDataPoint[] = [
  { label: 'จ.', incidents: 12, avg: 9 },
  { label: 'อ.', incidents: 8, avg: 9 },
  { label: 'พ.', incidents: 15, avg: 10 },
  { label: 'พฤ.', incidents: 5, avg: 8 },
  { label: 'ศ.', incidents: 20, avg: 11 },
  { label: 'ส.', incidents: 9, avg: 9 },
  { label: 'อ.', incidents: 11, avg: 10 },
]

const singleLineData: LineChartDataPoint[] = [
  { label: 'ม.ค.', volume: 12400 },
  { label: 'ก.พ.', volume: 10800 },
  { label: 'มี.ค.', volume: 13200 },
  { label: 'เม.ย.', volume: 9500 },
  { label: 'พ.ค.', volume: 11300 },
  { label: 'มิ.ย.', volume: 10200 },
  { label: 'ก.ค.', volume: 14100 },
]

const speedLines: LineConfig[] = [
  { dataKey: 'speed', color: '#FCD116', label: 'ความเร็วสูงสุด' },
  { dataKey: 'avg', color: '#66AEFF', label: 'ความเร็วเฉลี่ย' },
]

const speedStats: LineChartStat[] = [
  { value: 100, label: 'ความเร็วสูงสุด (กม./ชม.)', color: '#FCD116' },
  { value: 70, label: 'ความเร็วเฉลี่ย (กม./ชม.)', color: '#66AEFF' },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Chart/LineChart',
  component: LineChart,
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
      description: 'ข้อมูลกราฟ — แต่ละ object ต้องมี key `label` และ key ที่ตรงกับ lines[].dataKey',
    },
    lines: {
      control: 'object',
      description: 'กำหนดเส้นแต่ละชุด { dataKey, color, label }',
    },
    stats: {
      control: 'object',
      description: 'สรุปตัวเลขแสดงเหนือกราฟ { value, label, color }',
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
      description: 'ความสูง chart (px) — default 260',
    },
    yAxisTicks: {
      control: 'object',
      description: 'กำหนด ticks บน Y-axis เช่น [0, 25, 50, 75, 100]',
    },
    yAxisDomain: {
      control: 'object',
      description: 'domain ของ Y-axis เช่น [0, 120] หรือ [0, "auto"]',
    },
    accentColor: {
      control: 'color',
      description: 'สี title + icon accent (default #FCD116)',
    },
    cardBackground: {
      control: 'color',
      description: 'สีพื้นหลังการ์ด',
    },
    showGlow: {
      control: 'boolean',
      description: 'แสดง golden glow ที่มุมบน 2 มุม',
    },
    iconCircle: {
      control: 'boolean',
      description: 'ห่อ icon ในวงกลม yellow tint',
    },
    tooltipDate: {
      control: 'text',
      description: 'วันที่แสดงตรงบนสุดของ tooltip',
    },
    tooltipUnit: {
      control: 'text',
      description: 'หน่วยต่อท้ายค่าใน tooltip เช่น "กม./ชม."',
    },
    tooltipShowDot: {
      control: 'boolean',
      description: 'แสดงจุดสี (●) นำหน้า label ของแต่ละเส้นใน tooltip',
    },
  },
  args: {
    onPeriodChange: fn(),
  },
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * การแสดงผลหลัก — 2 เส้น พร้อม stats summary, period tab และ glow effect
 */
export const Default: Story = {
  args: {
    title: 'ความเร็วยานพาหนะ',
    subtitle: 'บันทึกรายชั่วโมงตลอดวัน',
    icon: <TbActivityHeartbeat className='text-yellow-400' size={20} />,
    data: hourlyData,
    lines: speedLines,
    stats: speedStats,
    periods: ['วัน', 'สัปดาห์', 'เดือน'],
    defaultPeriod: 'วัน',
    yAxisTicks: [0, 25, 50, 75, 100, 125],
    yAxisDomain: [0, 125],
  },
}

/**
 * Tooltip พร้อมวันที่ หน่วย และจุดสี — ทดสอบ tooltip extras ทั้งหมด
 */
export const TooltipExtras: Story = {
  name: 'Tooltip Extras',
  args: {
    title: 'ความเร็วยานพาหนะ',
    subtitle: 'บันทึกรายชั่วโมง',
    icon: <TbCar className='text-yellow-400' size={20} />,
    data: hourlyData,
    lines: speedLines,
    stats: speedStats,
    periods: ['วัน', 'สัปดาห์'],
    defaultPeriod: 'วัน',
    tooltipDate: '20 เม.ย. 2569',
    tooltipUnit: 'กม./ชม.',
    tooltipShowDot: true,
  },
}

/**
 * 2 เส้น — อุบัติเหตุรายวัน เปรียบเทียบกับค่าเฉลี่ย
 */
export const IncidentTrend: Story = {
  name: 'Incident Trend',
  args: {
    title: 'แนวโน้มอุบัติเหตุ',
    subtitle: 'จำนวนอุบัติเหตุรายวัน',
    icon: <TbAlertTriangle className='text-yellow-400' size={20} />,
    data: incidentData,
    lines: [
      { dataKey: 'incidents', color: '#ef4444', label: 'อุบัติเหตุ' },
      { dataKey: 'avg', color: '#94a3b8', label: 'ค่าเฉลี่ย' },
    ],
    stats: [
      { value: 20, label: 'สูงสุดในสัปดาห์', color: '#ef4444' },
      { value: 9, label: 'ค่าเฉลี่ย', color: '#94a3b8' },
    ],
    periods: ['สัปดาห์', 'เดือน', 'ปี'],
    defaultPeriod: 'สัปดาห์',
    yAxisDomain: [0, 'auto'],
  },
}

/**
 * 1 เส้น — ปริมาณการจราจรรายเดือน ไม่มี stats
 */
export const SingleLine: Story = {
  name: 'Single Line',
  args: {
    title: 'ปริมาณการจราจร',
    subtitle: 'จำนวนยานพาหนะรายเดือน',
    icon: <TbCar className='text-yellow-400' size={20} />,
    data: singleLineData,
    lines: [{ dataKey: 'volume', color: '#22d3ee', label: 'ปริมาณรถ' }],
    periods: ['เดือน', 'ปี'],
    defaultPeriod: 'เดือน',
    yAxisDomain: [0, 'auto'],
  },
}

/**
 * ไม่มี period tab — widget แบบ static ไม่ให้ผู้ใช้เปลี่ยน period
 */
export const NoPeriodTabs: Story = {
  name: 'No Period Tabs',
  args: {
    title: 'ความเร็วยานพาหนะ',
    subtitle: 'บันทึกรายชั่วโมงตลอดวัน',
    icon: <TbActivityHeartbeat className='text-yellow-400' size={20} />,
    data: hourlyData,
    lines: speedLines,
    stats: speedStats,
  },
}

/**
 * ไม่มี icon, subtitle และ stats — header เรียบง่ายที่สุด
 */
export const TitleOnly: Story = {
  name: 'Title Only',
  args: {
    title: 'ปริมาณการจราจร',
    data: singleLineData,
    lines: [{ dataKey: 'volume', color: '#22d3ee', label: 'ปริมาณรถ' }],
    periods: ['เดือน', 'ปี'],
    defaultPeriod: 'เดือน',
  },
}

/**
 * ความสูง chart 180px — widget ขนาดเล็กสำหรับ dashboard ที่มีพื้นที่จำกัด
 */
export const CompactHeight: Story = {
  name: 'Compact Height (180px)',
  args: {
    title: 'ความเร็วยานพาหนะ',
    subtitle: 'บันทึกรายชั่วโมงตลอดวัน',
    icon: <TbActivityHeartbeat className='text-yellow-400' size={20} />,
    data: hourlyData,
    lines: speedLines,
    periods: ['วัน', 'สัปดาห์'],
    defaultPeriod: 'วัน',
    height: 180,
  },
}
