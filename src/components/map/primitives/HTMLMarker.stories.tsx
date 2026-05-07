import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { TbBolt, TbAlertTriangle } from 'react-icons/tb'
import BaseMap from '../BaseMap'
import ThailandMaskLayer from '../markers/ThailandMaskLayer'
import HTMLMarker from './HTMLMarker'

/**
 * `<HTMLMarker>` — Primitive ระดับล่าง
 *
 * ใช้เมื่ออยากให้ marker เป็น **JSX/HTML/รูปภาพแบบกำหนดเอง** (truck icon, animated badge, custom shape)
 * — Mapbox จะ wrap children ของเรา + จัดการตำแหน่งตาม lng/lat ให้
 *
 * **เทียบกับ `<MarkerLayer>`:**
 * - `MarkerLayer` = Mapbox circle/symbol + cluster (efficient สำหรับ marker เยอะ)
 * - `HTMLMarker` = DOM marker ปกติ (flexible แต่ไม่เหมาะกับ marker หลายพันตัว)
 */
const meta = {
  title: 'Components/Map/Primitives/HTMLMarker',
  component: HTMLMarker,
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
        <BaseMap initialCenter={[100.5, 13.75]} initialZoom={6}>
          <ThailandMaskLayer />
          <Story />
        </BaseMap>
      </div>
    ),
  ],
  argTypes: {
    lngLat: {
      control: 'object',
      description: '[lng, lat] — ตำแหน่งบนแผนที่',
    },
    anchor: {
      control: 'select',
      options: ['center', 'top', 'bottom', 'left', 'right'],
      description: 'ส่วนของ element ที่จะ anchor ที่ lng/lat',
    },
    offset: {
      control: 'object',
      description: 'pixel offset [x, y] เพิ่มเติม — ใช้กรณี SVG มี shadow padding',
    },
    onClick: {
      action: 'onClick',
      description: 'callback เมื่อคลิก marker',
    },
    visible: {
      control: 'boolean',
      description: 'ซ่อน/แสดง marker (default true)',
    },
    title: {
      control: 'text',
      description: 'tooltip ตอน hover',
    },
    popup: {
      control: false,
      description: 'render function สำหรับ popup เมื่อคลิก',
    },
  },
  args: {
    lngLat: [100.5, 13.75],
    anchor: 'center',
    visible: true,
    onClick: fn(),
  },
} satisfies Meta<typeof HTMLMarker>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Marker แบบข้อความ — children เป็น JSX อิสระ
 */
export const TextMarker: Story = {
  args: {
    title: "Bangkok",

    children: (
      <div
        style={{
          padding: '6px 12px',
          background: '#FCD116',
          color: '#050d1a',
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        🏛 กรุงเทพมหานคร
      </div>
    ),

    anchor: "center"
  },
}

/**
 * Marker แบบ icon จาก react-icons — แต่งสีเอง
 */
export const ReactIconMarker: Story = {
  args: {
    title: 'Lighting',
    children: (
      <div
        style={{
          padding: 8,
          background: '#FCD116',
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        <TbBolt size={20} color="#050d1a" />
      </div>
    ),
  },
}

/**
 * Marker แบบ image จาก public folder — pattern เดียวกับ TrackingOverviewMarker
 *
 * ต้องใช้ `anchor="bottom"` + `offset={[0, 19]}` เพราะ SVG มี shadow ขยายลงล่าง
 */
export const ImageMarker: Story = {
  name: 'Image Marker (SVG from public)',
  args: {
    anchor: 'bottom',
    offset: [0, 19],
    title: 'WIM Station',
    children: (
      <img
        src="/images/icon-marker/Wim.svg"
        alt=""
        width={43}
        height={46}
        draggable={false}
        style={{ display: 'block', userSelect: 'none' }}
      />
    ),
  },
}

/**
 * Marker + Popup — คลิกเพื่อดูเนื้อหา
 *
 * Popup รับ JSX เต็มรูปแบบ ใช้ React state / hooks ได้ตามปกติ
 */
export const WithPopup: Story = {
  args: {
    anchor: 'bottom',
    offset: [0, 19],
    title: 'Click me',
    children: (
      <img src="/images/icon-marker/Station.svg" alt="" width={43} height={46} />
    ),
    popup: () => (
      <div
        style={{
          padding: 12,
          minWidth: 200,
          background: '#0f172a',
          border: '1px solid #66FF9E',
          borderRadius: 8,
          color: '#fff',
        }}
      >
        <div style={{ fontWeight: 700, color: '#66FF9E' }}>
          <TbAlertTriangle style={{ display: 'inline', marginRight: 6 }} />
          สถานีตัวอย่าง
        </div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#94a3b8' }}>
          คลิกที่อื่นบนแผนที่เพื่อปิด
        </div>
      </div>
    ),
  },
}

/**
 * Marker หลายตัว — แต่ละตัวต้องห่อ `<HTMLMarker>` แยก (วาง JSX หลาย ๆ อันใน parent)
 *
 * ถ้ามี marker เยอะ (>100 ตัว) แนะนำใช้ `<MarkerLayer>` แทนเพื่อประสิทธิภาพ
 */
export const MultipleMarkers: Story = {
  args: {
    // unused — `render` overrides the default render
    lngLat: [100.5, 13.75],
    children: null,
  },
  render: () => (
    <>
      {[
        { lng: 98.985, lat: 18.788, label: 'เชียงใหม่', color: '#FCD116' },
        { lng: 102.097, lat: 14.980, label: 'นครราชสีมา', color: '#EB66FF' },
        { lng: 100.595, lat: 7.190, label: 'สงขลา', color: '#66FF9E' },
        { lng: 100.5, lat: 13.75, label: 'กรุงเทพ', color: '#06b6d4' },
      ].map((p) => (
        <HTMLMarker key={p.label} lngLat={[p.lng, p.lat]} anchor="center" title={p.label}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: p.color,
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          />
        </HTMLMarker>
      ))}
    </>
  ),
}

/**
 * `visible={false}` — ซ่อน marker โดยไม่ unmount React tree
 *
 * เหมาะสำหรับ filter ที่อยาก preserve component state (ไม่ re-render)
 */
export const Hidden: Story = {
  args: {
    visible: false,
    children: (
      <div style={{ width: 24, height: 24, background: 'red', borderRadius: '50%' }} />
    ),
  },
}
