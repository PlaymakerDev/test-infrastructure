import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import BaseMap from '../BaseMap'
import ThailandMaskLayer from './ThailandMaskLayer'
import TrackingOverviewMarker from './TrackingOverviewMarker'
import {
  TRACKING_STATIONS,
  type TrackingStation,
} from '@/features/admin/tracking/overall/data/trackingStations'

/**
 * `<TrackingOverviewMarker>` — pin marker สำหรับหน้า Tracking
 *
 * - 3 ประเภทแยกสี: WIM (เหลือง) · เคลื่อนที่ (ม่วง) · สถานี (เขียว)
 * - SVG icon อยู่ที่ `public/images/icon-marker/`
 * - มี default popup สรุปข้อมูล (ชื่อ, รหัส, สถานะ, ยอดรถเข้าชั่ง, น้ำหนักเกิน) — override ได้
 *
 * **ที่ใช้งานจริงในโปรเจกต์:**
 * - Tracking tab "ภาพรวม" → all 3 types
 * - Tracking tab "WIM" → filter เฉพาะ WIM (เหลือง)
 */
const meta = {
  title: 'Components/Map/Markers/TrackingOverviewMarker',
  component: TrackingOverviewMarker,
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
        <BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
          <ThailandMaskLayer />
          <Story />
        </BaseMap>
      </div>
    ),
  ],
  argTypes: {
    stations: {
      control: false,
      description: 'รายการ stations — ดู type `TrackingStation` ใน [trackingStations.ts](../../features/admin/tracking/overall/data/trackingStations.ts)',
    },
    visibleTypes: {
      control: false,
      description: 'Set ของประเภทที่แสดง — ตัวที่ไม่อยู่ใน set จะถูกซ่อน. ส่ง undefined = แสดงทั้งหมด',
    },
    onClick: {
      action: 'onClick',
      description: 'callback เมื่อคลิก marker — ทำงานควบคู่กับ popup ได้',
    },
    popup: {
      control: false,
      description: 'render function สำหรับ popup. ส่ง undefined = ใช้ default. ส่ง null = ปิด popup',
    },
  },
  args: {
    stations: TRACKING_STATIONS,
    onClick: fn(),
  },
} satisfies Meta<typeof TrackingOverviewMarker>

export default meta
type Story = StoryObj<typeof meta>

/**
 * ค่า default — แสดงทั้ง 3 ประเภท + ใช้ popup ที่ build-in มาให้
 *
 * ลองคลิก marker ดู — popup จะเด้งแสดงข้อมูลของ station นั้น
 */
export const Default: Story = {}

/**
 * แสดงเฉพาะ WIM (เหลือง) — pattern เดียวกับ Tracking tab "WIM"
 */
export const WimOnly: Story = {
  name: 'WIM Only (Yellow)',
  args: {
    visibleTypes: new Set(['wim']),
  },
}

/**
 * แสดงเฉพาะหน่วยเคลื่อนที่ (ม่วง)
 */
export const MobileOnly: Story = {
  name: 'Mobile Only (Magenta)',
  args: {
    visibleTypes: new Set(['mobile']),
  },
}

/**
 * แสดงเฉพาะสถานี (เขียว)
 */
export const StationOnly: Story = {
  name: 'Station Only (Green)',
  args: {
    visibleTypes: new Set(['station']),
  },
}

/**
 * แสดง 2 ประเภทผสมกัน — WIM + เคลื่อนที่
 */
export const WimAndMobile: Story = {
  name: 'WIM + Mobile (no station)',
  args: {
    visibleTypes: new Set(['wim', 'mobile']),
  },
}

/**
 * Custom popup — เปลี่ยนเนื้อหาเป็น JSX ของตัวเอง
 *
 * ใช้กรณีที่หน้า feature ต้องการ popup รูปแบบเฉพาะ เช่นมีปุ่ม "ดูรายละเอียด" ลิงก์ไปหน้าอื่น
 */
export const CustomPopup: Story = {
  args: {
    popup: (s: TrackingStation) => (
      <div
        style={{
          padding: 16,
          minWidth: 240,
          background: '#0f172a',
          border: '2px solid #06b6d4',
          borderRadius: 12,
          color: '#fff',
          fontFamily: 'ui-sans-serif',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          🚛 {s.name}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          รหัส: {s.code}
        </div>
        <button
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#06b6d4',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          onClick={() => alert(`ไปที่หน้ารายละเอียด ${s.id}`)}
        >
          ดูรายละเอียด →
        </button>
      </div>
    ),
  },
}

/**
 * ปิด popup เลย — ใช้ `onClick` จัดการเองแทน (เช่น เปิด modal, นำทางไปหน้าอื่น)
 *
 * ตรวจสอบใน Actions panel ของ Storybook ว่า `onClick` ถูกเรียกตอนคลิก
 */
export const NoPopupCustomClick: Story = {
  name: 'No Popup (custom onClick)',
  args: {
    popup: null,
  },
}

/**
 * Empty state — ส่ง stations ว่าง ทดสอบว่าไม่มี marker เลย map ก็ยังแสดงปกติ
 */
export const EmptyData: Story = {
  args: {
    stations: [],
  },
}
