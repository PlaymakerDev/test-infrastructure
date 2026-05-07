# Map Architecture — Design Doc

**Status:** Draft (รอ review จากทีม)
**Author:** —
**Last updated:** 2026-05-07

---

## 1. เป้าหมาย

แตก [ReactMap.tsx](./ReactMap.tsx) (~570 บรรทัด ทำงานเฉพาะ Dashboard) ออกเป็น **map component library กลาง** ที่ feature อื่น ๆ (CCTV / Tracking / Lighting / WIM) นำไปใช้ต่อได้ — โดย **marker แต่ละแบบไม่ต้องเขียน Mapbox boilerplate ใหม่**

## 2. ปัญหาปัจจุบัน

[ReactMap.tsx](./ReactMap.tsx) ทำทุกอย่างในไฟล์เดียว:
- Mapbox init + Thailand mask + province highlight
- 10 system layers + clustering
- 18 STCH summary markers
- Filter pills + breadcrumb UI

**ผลกระทบ:**
- Feature อื่นที่อยากใช้ map (เช่น CCTV/Tracking) **ใช้ซ้ำไม่ได้** — ต้อง copy-paste แล้วแก้ทั้งไฟล์
- เพิ่ม marker style ใหม่ (truck icon, density bubble) → ต้องแก้ ReactMap → ไฟล์บวมเรื่อย ๆ
- Logic clean-up Mapbox (`removeLayer`, `removeSource`, `removeImage`) อยู่ใน effect เดียว — เสี่ยง memory leak ถ้าจัดการไม่ดี

## 3. โครงสร้างที่เสนอ — 2 ชั้น

### ชั้น 1: Primitives (low-level)

Components ที่ wrap Mapbox API โดยตรง — **ไม่ผูกกับ business logic ใด ๆ**

| Primitive | หน้าที่ |
|---|---|
| `<BaseMap>` | init mapbox-gl, จัดการ instance lifecycle, provide `MapContext` |
| `<MarkerLayer>` | wrap source + 1-3 layers (circle/symbol), รองรับ clustering |
| `<HTMLMarker>` | DOM marker wrapper (`mapboxgl.Marker`) — ใส่ JSX อะไรก็ได้ข้างใน |
| `<MapImageRegistrar>` | register react-icon → SVG → mapbox image |
| `useMap()` | hook เข้าถึง mapbox instance จาก context |

### ชั้น 2: Presets (high-level)

Components ที่ build บน primitive — **มี business logic / data shape เฉพาะ**

| Preset | ใช้ที่ | Build จาก |
|---|---|---|
| `<DeviceClusterMarker>` | Dashboard, CCTV | `MarkerLayer` (circle + symbol + cluster) |
| `<StchSummaryMarker>` | Dashboard | `HTMLMarker` × 18 |
| `<TruckIconMarker>` | Tracking - รายสายทาง | `HTMLMarker` |
| `<DensityBubbleMarker>` | Tracking - GPS overview | `MarkerLayer` (circle + size scale) |
| `<NumberedAlertMarker>` | Lighting alerts | `MarkerLayer` (circle + count text) |
| `<ProvinceHighlightLayer>` | ทุก map | direct mapbox layer (fill + line) |

แต่ละ preset = **~30-80 บรรทัด** ที่เลือก config ของ primitive ให้แล้ว map data shape → Mapbox format

## 4. Marker contract

ทุก preset marker accept props มาตรฐานเหล่านี้:

```ts
interface MarkerProps<T = unknown> {
  data: GeoJSON.FeatureCollection | T[]
  visible?: boolean              // default true
  onClick?: (feature) => void
  onHover?: (feature) => void
  popup?: (feature) => ReactNode // optional — render popup content
}
```

→ ทีมใช้ marker ตัวไหนก็คาดเดา API ได้ ไม่ต้องอ่าน source

## 5. โครงสร้างไฟล์

```
src/components/map/
  README.md                    ← link มาที่ doc นี้
  ARCHITECTURE.md              ← (ไฟล์นี้)
  BaseMap.tsx                  ← init + MapContext
  MapContext.tsx               ← React Context
  hooks/
    useMap.ts                  ← consume MapContext
  primitives/
    MarkerLayer.tsx            ← source + layer (circle/symbol)
    HTMLMarker.tsx             ← DOM marker wrapper
    MapImageRegistrar.tsx      ← register icon → mapbox image
  markers/                     ← presets
    DeviceClusterMarker.tsx
    StchSummaryMarker.tsx
    TruckIconMarker.tsx
    DensityBubbleMarker.tsx
    NumberedAlertMarker.tsx
    ProvinceHighlightLayer.tsx
  overlays/
    SystemFilterPills.tsx      ← filter pills (Dashboard, CCTV)
    BreadcrumbBanner.tsx       ← สทช.X › ขทช. (ทุก map ที่มี zoom จังหวัด)
  data/
    thailand-mask.tsx          ← layer/source ของ mask + provinces
```

ไฟล์ใหม่ทั้งหมด **ย้ายไปอยู่ใน `src/components/map/`** ส่วน `data/` ของ Dashboard
([systems.ts](../../features/admin/dashboard/data/systems.ts), provinces, units, mockDevices) **คงอยู่ใน feature folder**
เพราะเป็น domain data ของ Dashboard ไม่ใช่ map infrastructure

## 6. ตัวอย่างการใช้งานจริง

### Dashboard (replace ของเดิม)

```tsx
<BaseMap initialZoom={5.2} initialCenter={[101.5, 14.0]}>
  <ThailandMaskLayer />
  <ProvinceHighlightLayer />
  <DeviceClusterMarker
    data={devices}
    systems={SYSTEM_TYPES}
    visible={visibleTypes}
  />
  <StchSummaryMarker counts={stchCounts} hideAtZoom={6.5} />

  <SystemFilterPills value={visibleTypes} onChange={setVisibleTypes} />
  <BreadcrumbBanner />
</BaseMap>
```

### CCTV overview

```tsx
<BaseMap>
  <ThailandMaskLayer />
  <DeviceClusterMarker
    data={cctvDevices}
    systems={['CCTV']}
    color="#FCD116"
    onClick={(f) => router.push(`/admin/cctv/${f.properties.id}`)}
  />
  <BreadcrumbBanner />
</BaseMap>
```

### Tracking - tab "ข้อมูลรถรายสายทาง"

```tsx
<BaseMap initialZoom={11} initialCenter={selectedRoute.center}>
  <TruckIconMarker
    trucks={truckPositions}
    colorBy="weight"
    onClick={(t) => setSelectedTruck(t.id)}
  />
</BaseMap>
```

### Tracking - tab "ภาพรวม GPS"

```tsx
<BaseMap>
  <ThailandMaskLayer />
  <DensityBubbleMarker
    data={gpsAggregated}
    sizeKey="vehicleCount"
    colorScale="yellow-red"
  />
</BaseMap>
```

## 7. Migration Plan

### Phase 1 — Infrastructure (PR 1)

- [ ] สร้าง `BaseMap.tsx` + `MapContext.tsx` + `useMap()`
- [ ] สร้าง `<ThailandMaskLayer>` + `<ProvinceHighlightLayer>`
- [ ] **ไม่แตะ ReactMap.tsx** — เก็บไว้เป็น reference

### Phase 2 — Primitives (PR 2)

- [ ] สร้าง `<MarkerLayer>` (circle + symbol + cluster)
- [ ] สร้าง `<HTMLMarker>`
- [ ] สร้าง `<MapImageRegistrar>` สำหรับ icon
- [ ] เขียน Storybook ให้ดูตัวอย่าง

### Phase 3 — Presets ที่ Dashboard ใช้ (PR 3)

- [ ] `<DeviceClusterMarker>` (build บน MarkerLayer)
- [ ] `<StchSummaryMarker>` (build บน HTMLMarker)
- [ ] `<SystemFilterPills>` + `<BreadcrumbBanner>`
- [ ] **Refactor [ReactMap.tsx](./ReactMap.tsx)** ให้ใช้ของใหม่ (ลด 570 → ~100 บรรทัด)
- [ ] Smoke test ที่ /admin/dashboard

### Phase 4 — Presets เพิ่มเติม (เมื่อมี feature ใช้)

- [ ] `<TruckIconMarker>` ตอน Tracking ทำ tab รายสายทาง
- [ ] `<DensityBubbleMarker>` ตอน Tracking ทำ tab GPS overview
- [ ] `<NumberedAlertMarker>` ตอน Lighting

→ **ไม่ต้องเขียนทุก preset ตั้งแต่แรก** — ทำตามที่ feature ต้องการ

## 8. ข้อพิจารณา / คำถามให้ทีม review

### 8.1 Singleton vs Multi-instance

**คำถาม:** ในหน้าหนึ่งมี `<BaseMap>` ได้กี่ตัว?
- **Single (แนะนำ):** ง่ายต่อ resource management, ไม่ต้องกังวลว่า mapbox token rate limit / WebGL context
- **Multi:** ยืดหยุ่นกว่า แต่ต้องดู performance (Mapbox WebGL context ค่อนข้างหนัก)

### 8.2 Source granularity

**คำถาม:** สำหรับ DeviceClusterMarker ที่มี 10 ระบบ — ใช้ **1 source ต่อระบบ** (ปัจจุบัน) หรือ **1 source รวม** + filter expression?

- **1 source ต่อระบบ (ปัจจุบัน):** clustering แยกแต่ละระบบ → marker ของระบบต่างกันไม่รวมกลุ่มกัน
- **1 source รวม + filter:** ลด API calls, cluster ปนกันได้ — ขึ้นอยู่กับ design

### 8.3 React state vs Mapbox imperative

**คำถาม:** filter visibility — ใช้ React state ↔ `setLayoutProperty('visibility')` (ปัจจุบัน) หรือเปลี่ยน data ที่ source?

- **setLayoutProperty (ปัจจุบัน):** เร็ว, layer ยังอยู่ใน Mapbox
- **เปลี่ยน data:** clean กว่า แต่ Mapbox ต้อง re-cluster ทุกครั้งที่ toggle

### 8.4 TypeScript ของ Feature properties

ตอน `onClick(feature)` callback — feature properties เป็น generic หรือ fixed shape?

```ts
// Option A: generic — ทุก marker รับ <T>
<DeviceClusterMarker<DeviceProperties> ... />

// Option B: fixed shape per preset
<DeviceClusterMarker /> // properties: DeviceProperties (ตายตัว)
```

**แนะนำ B** เพราะ preset มี data shape ชัดเจน — primitive (`MarkerLayer<T>`) เป็น generic

### 8.5 Storybook

มี Storybook อยู่แล้ว — primitive + preset ควรเขียน story ครบไหม?
- **+:** ทีม designer/dev ดู variants ได้ง่าย, เป็น living doc
- **−:** เขียน story ของ map ค่อนข้างยุ่ง (ต้องใส่ container ขนาด, mock token, ฯลฯ)

## 9. ตัวเลือกที่ถูกตัดออก (พร้อมเหตุผล)

### A. "1 marker type = 1 component" ทั้งหมด
ไม่เลือกเพราะ — variants ใหม่ → ไฟล์ใหม่เรื่อย ๆ, code duplicate

### B. ใช้ `react-map-gl` แทน mapbox-gl ตรง ๆ
น่าสนใจ (declarative `<Source>` `<Layer>`) — แต่:
- ปัจจุบัน [ReactMap.tsx](./ReactMap.tsx) ใช้ mapbox-gl ตรง ๆ → migrate เพิ่มเวลา
- react-map-gl wrap แค่บางส่วน → custom marker logic (HTML markers, popup) ยังต้อง imperative
- ทำเอง flexible กว่าและลด dependency

→ **เก็บไว้ทบทวนใหม่ในอนาคต** ถ้าทีมใหญ่ขึ้นและอยาก declarative ทั้งหมด

### C. แยก `<DashboardMap>`, `<CCTVMap>`, `<TrackingMap>` ขาดกัน
ไม่เลือกเพราะ — code duplicate ของ mask + province + init logic

## 10. Open Questions

1. **Mapbox style URL** — ใช้ style เดียวกันทุก map view (`cmno2zx3b002j01qtdbg71r0x` ของ its-dashboard) หรือให้แต่ละ feature เลือก style ของตัวเอง?
2. **Loading state** — ตอน fetch geojson + register icons → BaseMap ควรแสดง skeleton/spinner ไหม?
3. **Error boundary** — ถ้า Mapbox load ผิดพลาด (network/token) → fallback แบบไหน?

---

## Approval

- [ ] Phu (frontend)
- [ ] Ta (component กลาง)
- [ ] Playmaker (Tracking/WIM)
- [ ] —

หลังทีม approve → เริ่ม Phase 1 ตามแผน
