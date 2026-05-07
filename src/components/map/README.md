# Map & Marker — คู่มือใช้งาน

> สำหรับทีม dev ที่จะสร้าง map ในหน้า feature ใหม่
> รายละเอียดเชิง design อยู่ที่ [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🎯 ภาพรวม 30 วินาที

แผนที่ในโปรเจกต์นี้แบ่งเป็น **2 ชั้น**:

1. **`BaseMap`** = "ที่ใส่แผนที่" (container) — init Mapbox + provide context
2. **Marker components** = "สิ่งที่อยู่บนแผนที่" — ใส่เป็น `children` ได้ตามต้องการ

```tsx
<BaseMap>
  <ThailandMaskLayer />              {/* mask ดำรอบประเทศไทย */}
  <DeviceClusterMarker devices={x} /> {/* marker แบบ cluster */}
  <SystemFilterPills value={x} ... /> {/* UI overlay */}
</BaseMap>
```

แค่นี้ — Mapbox boilerplate (init, source, layer, cleanup) ไม่ต้องเขียนเอง

---

## 🚀 Quick Start — 3 รูปแบบใช้บ่อย

### A. แผนที่ภาพรวม Tracking (มี marker pin 3 สี + filter)

```tsx
"use client"
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import TrackingOverviewMarker from '@/components/map/markers/TrackingOverviewMarker'
import { TRACKING_STATIONS } from '@/features/admin/tracking/overall/data/trackingStations'

<BaseMap initialCenter={[101.0, 14.5]} initialZoom={5.4}>
  <ThailandMaskLayer />
  <TrackingOverviewMarker stations={TRACKING_STATIONS} />
</BaseMap>
```

### B. แสดงเฉพาะบางประเภท (เช่น tab WIM)

```tsx
<TrackingOverviewMarker
  stations={TRACKING_STATIONS}
  visibleTypes={new Set(['wim'])}        // แสดงเฉพาะ WIM (เหลือง)
/>
```

### C. Custom popup ของตัวเอง (override default)

```tsx
<TrackingOverviewMarker
  stations={TRACKING_STATIONS}
  popup={(station) => (
    <MyCustomCard
      station={station}
      onAction={() => router.push(`/wim/${station.id}`)}
    />
  )}
/>
```

> Popup รับ JSX เต็มรูปแบบ — ใส่ component กลางอย่าง [`<CardList>`](../list/CardList.tsx), [`<SearchBar>`](../searchable/SearchBar.tsx), chart ของ Ta ได้

---

## 📦 ส่วนประกอบที่มีให้ใช้

### Container

| Component | ใช้ทำอะไร | ใส่ที่ไหน |
|---|---|---|
| [`BaseMap`](./BaseMap.tsx) | Init Mapbox + provider | นอกสุดเสมอ |

### Markers (ของพร้อมใช้)

| Component | ใช้ทำอะไร | ใช้ใน |
|---|---|---|
| [`ThailandMaskLayer`](./markers/ThailandMaskLayer.tsx) | Mask ดำรอบไทย + ไฮไลท์จังหวัด | ทุกแผนที่ |
| [`DeviceClusterMarker`](./markers/DeviceClusterMarker.tsx) | 10 ระบบ (CCTV/VMS/...) + cluster | Dashboard, CCTV |
| [`StchSummaryMarker`](./markers/StchSummaryMarker.tsx) | 18 marker เหลือง สทช. (zoom < 6.5) | Dashboard |
| [`TrackingOverviewMarker`](./markers/TrackingOverviewMarker.tsx) | Pin 3 สี (WIM/Moving/Station) + popup | Tracking |

### Overlays (UI ลอยบนแผนที่)

| Component | ใช้ทำอะไร |
|---|---|
| [`SystemFilterPills`](./overlays/SystemFilterPills.tsx) | ปุ่ม filter ระบบ — ใช้คู่กับ DeviceClusterMarker |
| [`BreadcrumbBanner`](./overlays/BreadcrumbBanner.tsx) | "สทช.X › ขทช.จังหวัด" |

### Primitives (สำหรับสร้าง marker preset ใหม่)

| Primitive | ใช้เมื่อ |
|---|---|
| [`MarkerLayer`](./primitives/MarkerLayer.tsx) | อยากใช้ Mapbox circle/symbol layer (รองรับ cluster) |
| [`HTMLMarker`](./primitives/HTMLMarker.tsx) | อยากใช้ JSX/SVG/img เป็น marker |

---

## ➕ อยากสร้าง Marker ใหม่ — ทำตาม 3 step

### Step 1: รู้ก่อนว่าใช้ primitive ไหน

```
อยากได้ marker แบบไหน?
├─ วงกลม / icon SVG จาก Mapbox / cluster      → MarkerLayer
└─ รูปทรงอิสระ (HTML, รูปภาพ, animation)        → HTMLMarker
```

### Step 2: สร้าง preset file

```tsx
// src/components/map/markers/MyMarker.tsx
"use client"
import HTMLMarker from '../primitives/HTMLMarker'

export interface MyMarkerProps {
  data: { id: string; coord: [number, number]; name: string }[]
  popup?: (item: MyData) => React.ReactNode | null
  onClick?: (item: MyData) => void
}

const MyMarker: React.FC<MyMarkerProps> = ({ data, popup, onClick }) => (
  <>
    {data.map((d) => (
      <HTMLMarker
        key={d.id}
        lngLat={d.coord}
        anchor="bottom"
        title={d.name}
        onClick={onClick ? () => onClick(d) : undefined}
        popup={popup === null ? undefined : popup ? () => popup(d) : () => <DefaultPopup d={d} />}
      >
        <img src="/images/my-icon.svg" width={32} />
      </HTMLMarker>
    ))}
  </>
)

export default MyMarker
```

### Step 3: นำไปใช้

```tsx
<BaseMap>
  <ThailandMaskLayer />
  <MyMarker data={items} />
</BaseMap>
```

---

## 🪤 ปัญหาที่เจอบ่อย

### 1. Marker tip ไม่ตรงตำแหน่งจริง
**สาเหตุ:** SVG มี shadow / padding ทำให้ขอบล่างของรูปไม่ใช่ปลาย pin
**แก้:** เพิ่ม `offset` ให้ HTMLMarker
```tsx
<HTMLMarker anchor="bottom" offset={[0, 19]}>  {/* shift ลง 19px */}
```

### 2. Click ไม่ทำงาน
**เช็ค:**
- Marker mount หรือยัง? (BaseMap ต้องโหลด map เสร็จก่อน)
- ใส่ `onClick` หรือ `popup` หรือยัง? (ถ้าไม่มีทั้งคู่ → cursor เป็น default + ไม่มี handler)

### 3. Popup ซ้อนกัน
ระบบจัดการให้แล้ว — **1 popup ต่อ map** เสมอ ผ่าน [`popupHelper.ts`](./primitives/popupHelper.ts)

### 4. Hydration error
HTMLMarker ใช้ `mounted` state กันอยู่แล้ว — ถ้าเจอ hydration error ในที่อื่น เช็ค `"use client"` directive

### 5. Marker ขนาดผิดเพราะ DOM = 0
ตอน parent ซ่อน marker ด้วย `display: none` ก่อนแสดง → Mapbox วาดบน DOM ที่ขนาด 0
**แก้:** ใช้ `matchMedia` hook render conditional แทน CSS hide (ดูตัวอย่างใน [DashboardScreen](../../features/admin/dashboard/screen/index.tsx#L20-L30))

---

## 📁 SVG icon — ใส่ที่ไหน

```
public/images/icon-marker/
  Wim.svg
  Moving.svg
  Station.svg
  YourNewIcon.svg     ← drop ที่นี่
```

Designer อัพโหลด SVG ใหม่ → dev เพิ่ม map ใน preset:
```ts
const ICON_URL_BY_TYPE = {
  ...,
  newType: '/images/icon-marker/YourNewIcon.svg',
}
```

ไม่ต้อง import เป็น React component — `<img src="...">` พอ (browser จะ cache ให้)

---

## 💡 จำง่าย ๆ

- **เริ่มหน้าใหม่** → copy [Quick Start A](#a-แผนที่ภาพรวม-tracking-มี-marker-pin-3-สี--filter) แล้วปรับ
- **Filter marker** → ส่ง `visibleTypes` set
- **เปลี่ยน popup** → ส่ง `popup={(item) => <Custom />}`
- **ไม่มี popup ที่อยากได้** → ส่ง `popup={null}` แล้วเขียน UI เองผ่าน `onClick`
- **อยากได้ marker แบบใหม่** → ใช้ `HTMLMarker` (custom) หรือ `MarkerLayer` (cluster)

---

## ❓ ถามได้

- Map / marker ไม่ทำงาน → ส่ง screenshot + console error
- ไม่รู้จะใช้ primitive ไหน → ดู [decision tree](#step-1-รู้ก่อนว่าใช้-primitive-ไหน) หรือถาม
- API จริงเข้ามาแล้วต้องแก้อะไร → ดู `data → props` pattern: marker component ไม่ต้องแก้ แค่เปลี่ยน source ของ data
