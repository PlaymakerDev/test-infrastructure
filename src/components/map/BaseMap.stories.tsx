import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import BaseMap from './BaseMap'
import ThailandMaskLayer from './markers/ThailandMaskLayer'

/**
 * `<BaseMap>` — รากของแผนที่ทุกหน้า
 *
 * - Init Mapbox-GL อัตโนมัติ
 * - ใส่ marker / overlay เป็น `children` (composition)
 * - Container เป็น `position: absolute; inset: 0` → parent ต้อง `position: relative` + กำหนดขนาด
 *
 * ต้องมี `NEXT_PUBLIC_MAPBOX_TOKEN` ใน `.env` เพื่อให้แผนที่โหลดได้
 */
const meta = {
  title: 'Components/Map/BaseMap',
  component: BaseMap,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          background: '#050d1a',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    initialCenter: {
      control: 'object',
      description: '[lng, lat] — ศูนย์กลางเริ่มต้น (default: ประเทศไทย [101.5, 14.0])',
    },
    initialZoom: {
      control: { type: 'range', min: 3, max: 18, step: 0.5 },
      description: 'Zoom level เริ่มต้น (default: 5.2 = country view)',
    },
    initialPitch: {
      control: { type: 'range', min: 0, max: 60, step: 5 },
      description: 'มุมเอียงกล้อง (default: 0 = top-down)',
    },
    initialBearing: {
      control: { type: 'range', min: -180, max: 180, step: 15 },
      description: 'การหมุนแผนที่ (default: 0)',
    },
    styleUrl: {
      control: 'text',
      description: 'Mapbox style URL — default: dashboard dark style',
    },
    showAttribution: {
      control: 'boolean',
      description: 'แสดง attribution ของ Mapbox (default: false สำหรับ full-screen dashboard)',
    },
  },
} satisfies Meta<typeof BaseMap>

export default meta
type Story = StoryObj<typeof meta>

/**
 * แผนที่เปล่า — ค่า default ทุกอย่าง (ประเทศไทย, zoom 5.2)
 */
export const Default: Story = {
  args: {
    initialZoom: 4.5
  }
}

/**
 * เพิ่ม `<ThailandMaskLayer>` — มืดรอบประเทศ ส่อง spotlight เฉพาะแผ่นดินไทย
 *
 * Pattern ที่ใช้บ่อยที่สุดสำหรับ dashboard map ของโปรเจกต์
 */
export const WithThailandMask: Story = {
  render: (args) => (
    <BaseMap {...args}>
      <ThailandMaskLayer />
    </BaseMap>
  ),
}

/**
 * Zoom เข้ากรุงเทพ — ทดสอบ initialCenter / initialZoom
 */
export const BangkokView: Story = {
  args: {
    initialCenter: [100.5, 13.75],
    initialZoom: 11,
  },
  render: (args) => (
    <BaseMap {...args}>
      <ThailandMaskLayer />
    </BaseMap>
  ),
}

/**
 * มุมมอง 3D — pitch 45 + bearing -30 ดู perspective
 */
export const PerspectiveView: Story = {
  args: {
    initialCenter: [100.5, 13.75],
    initialZoom: 13,
    initialPitch: 45,
    initialBearing: -30,
  },
  render: (args) => (
    <BaseMap {...args}>
      <ThailandMaskLayer />
    </BaseMap>
  ),
}
