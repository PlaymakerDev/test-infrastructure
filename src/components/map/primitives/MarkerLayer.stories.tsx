import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import BaseMap from '../BaseMap'
import ThailandMaskLayer from '../markers/ThailandMaskLayer'
import MarkerLayer from './MarkerLayer'

/**
 * `<MarkerLayer>` — Primitive ระดับล่างที่ใช้ Mapbox circle/symbol layer
 *
 * **เลือกใช้เมื่อ:**
 * - ต้องการ marker จำนวนมาก (หลายร้อย-พัน) — ใช้ Mapbox layer = เร็วกว่า DOM markers
 * - ต้องการ clustering อัตโนมัติ
 * - แค่ต้องการวงกลม / icon ที่ register ไว้
 *
 * **ไม่เหมาะเมื่อ:**
 * - ต้องการ animation, hover state, รูปทรง custom — ใช้ `<HTMLMarker>` แทน
 *
 * **สำคัญ:** ต้องส่ง `data` เป็น GeoJSON FeatureCollection (จะ split source/layer ตาม `id` prop)
 */

// ─── Sample data: 50 จุดสุ่มในกรุงเทพ ────────────────────────────────────────────
function generatePoints(count: number, centerLng = 100.5, centerLat = 13.75) {
  const features = []
  for (let i = 0; i < count; i++) {
    const lng = centerLng + (Math.random() - 0.5) * 0.4
    const lat = centerLat + (Math.random() - 0.5) * 0.4
    features.push({
      type: 'Feature' as const,
      properties: { id: `pt-${i}`, label: `Point ${i + 1}` },
      geometry: { type: 'Point' as const, coordinates: [lng, lat] as [number, number] },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

const sampleData = generatePoints(50)
const denseData = generatePoints(500)

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Map/Primitives/MarkerLayer',
  component: MarkerLayer,
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
        <BaseMap initialCenter={[100.5, 13.75]} initialZoom={9}>
          <ThailandMaskLayer />
          <Story />
        </BaseMap>
      </div>
    ),
  ],
  argTypes: {
    id: {
      control: 'text',
      description: 'unique id — ใช้เป็น suffix ของ source/layer ของ Mapbox',
    },
    data: {
      control: false,
      description: 'GeoJSON FeatureCollection (point features)',
    },
    cluster: {
      control: 'boolean',
      description: 'เปิดการ cluster marker อัตโนมัติเมื่อ zoom out',
    },
    color: {
      control: 'color',
      description: 'สี fill ของวงกลม',
    },
    size: {
      control: { type: 'range', min: 4, max: 32, step: 2 },
      description: 'ขนาด radius (px) ของ marker เมื่อไม่ cluster (default 16)',
    },
    strokeColor: {
      control: 'color',
      description: 'สี stroke (default #ffffff)',
    },
    iconImage: {
      control: 'text',
      description: 'ชื่อ icon image ที่ register ไว้กับ Mapbox (optional)',
    },
    minZoom: {
      control: { type: 'range', min: 0, max: 18, step: 0.5 },
      description: 'ซ่อน marker เมื่อ zoom น้อยกว่าค่านี้',
    },
    visible: {
      control: 'boolean',
      description: 'toggle visibility',
    },
    onClick: {
      action: 'onClick',
      description: 'callback เมื่อคลิก unclustered marker',
    },
    onClusterClick: {
      action: 'onClusterClick',
      description: 'callback เมื่อคลิก cluster bubble (default = zoom in)',
    },
  },
  args: {
    onClick: fn(),
    onClusterClick: fn(),
  },
} satisfies Meta<typeof MarkerLayer>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Marker วงกลมพื้นฐาน — 50 จุดในกรุงเทพ ไม่มี cluster
 */
export const Default: Story = {
  args: {
    id: 'default',
    data: sampleData,
    color: '#FCD116',
    size: 12,
  },
}

/**
 * เปิด cluster — zoom out ดูจุดรวมตัวเป็นกลุ่ม คลิก cluster เพื่อ zoom in
 */
export const Clustered: Story = {
  args: {
    id: 'clustered',
    data: sampleData,
    color: '#06b6d4',
    cluster: true,
  },
}

/**
 * Marker เยอะ + cluster — 500 จุด แสดงประสิทธิภาพของ Mapbox cluster
 */
export const ManyMarkersClustered: Story = {
  name: 'Many Markers (500 + cluster)',
  args: {
    id: 'dense',
    data: denseData,
    color: '#EB66FF',
    cluster: true,
  },
}

/**
 * Popup เมื่อคลิก marker — render JSX เป็นเนื้อหา popup
 */
export const WithPopup: Story = {
  args: {
    id: 'with-popup',
    data: sampleData,
    color: '#66FF9E',
    cluster: true,
    popup: (feature) => {
      const p = feature.properties as { id: string; label: string }
      return (
        <div
          style={{
            padding: 10,
            minWidth: 160,
            background: '#0f172a',
            border: '1px solid #66FF9E',
            borderRadius: 8,
            color: '#fff',
          }}
        >
          <div style={{ fontWeight: 700, color: '#66FF9E' }}>{p.label}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>id: {p.id}</div>
        </div>
      )
    },
  },
}

/**
 * `visible={false}` — ซ่อนทั้ง layer (Mapbox `setLayoutProperty visibility: none`)
 *
 * ใช้คู่กับ filter pills เพื่อ toggle marker แต่ละชุด
 */
export const Hidden: Story = {
  args: {
    id: 'hidden',
    data: sampleData,
    color: '#ef4444',
    cluster: true,
    visible: false,
  },
}

/**
 * `minZoom` — แสดง marker เฉพาะเมื่อ zoom ≥ ค่าที่กำหนด
 *
 * เหมาะกับ pattern ที่ zoom out แสดงสรุป (เช่น STCH yellow markers ของ Dashboard)
 * แล้ว zoom in ค่อยแสดง marker รายตัว
 */
export const WithMinZoom: Story = {
  name: 'With minZoom (≥ 8)',
  args: {
    id: 'min-zoom',
    data: sampleData,
    color: '#FCD116',
    cluster: true,
    minZoom: 8,
  },
}
