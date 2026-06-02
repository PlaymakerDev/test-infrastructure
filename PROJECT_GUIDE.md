# DRR ITS — คู่มือเข้าใจโครงสร้างโปรเจกต์ (เวอร์ชันละเอียด)

> ระบบติดตามและวิเคราะห์ข้อมูลการจราจร กรมทางหลวงชนบท (Department of Rural Roads — Intelligent Transport System)
>
> ไฟล์นี้สร้างขึ้นเพื่อให้อ่านทบทวนโครงสร้างโปรเจกต์ได้เร็ว — **อย่า commit ขึ้น git**

---

## สารบัญ

- [1. Tech Stack แบบละเอียด](#1-tech-stack-แบบละเอียด)
- [2. การวางโครงสร้างโฟลเดอร์ — ทำไมวางแบบนี้](#2-การวางโครงสร้างโฟลเดอร์--ทำไมวางแบบนี้)
- [3. โครงสร้างไฟล์ทั้งหมดแบบละเอียด (ทุกไฟล์)](#3-โครงสร้างไฟล์ทั้งหมดแบบละเอียด-ทุกไฟล์)
  - [3.1 Root config files](#31-root-config-files)
  - [3.2 `public/` — static assets](#32-public----static-assets)
  - [3.3 `src/app/` — Next.js App Router](#33-srcapp----nextjs-app-router)
  - [3.4 `src/components/` — shared components](#34-srccomponents----shared-components)
  - [3.5 `src/configs/` — configuration](#35-srcconfigs----configuration)
  - [3.6 `src/constants/` — domain constants](#36-srcconstants----domain-constants)
  - [3.7 `src/features/` — feature modules](#37-srcfeatures----feature-modules)
  - [3.8 `src/lib/` — library setup](#38-srclib----library-setup)
  - [3.9 `src/services/` — API layer](#39-srcservices----api-layer)
  - [3.10 `src/stores/` — Redux Toolkit](#310-srcstores----redux-toolkit)
  - [3.11 `src/styles/` — CSS files](#311-srcstyles----css-files)
  - [3.12 `src/types/` — TypeScript interfaces](#312-srctypes----typescript-interfaces)
  - [3.13 `src/utils/` — utility functions](#313-srcutils----utility-functions)
  - [3.14 `src/proxy.ts` — middleware](#314-srcproxyts----middleware)
  - [3.15 `src/stories/` — Storybook](#315-srcstories----storybook)
- [4. Data Flow Diagrams](#4-data-flow-diagrams)
  - [4.1 Auth flow](#41-auth-flow)
  - [4.2 API request flow](#42-api-request-flow)
  - [4.3 Redux data flow](#43-redux-data-flow)
  - [4.4 Page render flow](#44-page-render-flow)
- [5. Environment Variables](#5-environment-variables)
- [6. Routing](#6-routing)
- [7. Feature Modules แบบละเอียด](#7-feature-modules-แบบละเอียด)
- [8. Map System](#8-map-system)
- [9. Shared UI Components](#9-shared-ui-components)
- [10. Types & Interfaces](#10-types--interfaces)
- [11. Constants](#11-constants)
- [12. Styles](#12-styles)
- [13. Storybook](#13-storybook)
- [14. Conventions & Patterns](#14-conventions--patterns)
- [15. หน้าที่ยังไม่เสร็จ / Placeholder](#15-หน้าที่ยังไม่เสร็จ--placeholder)
- [16. Quick Reference — ถ้าจะเพิ่ม feature ใหม่](#16-quick-reference--ถ้าจะเพิ่ม-feature-ใหม่)

---

## 1. Tech Stack แบบละเอียด

| Layer | Technology | Version | ทำไมเลือกตัวนี้ |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2+ | SSR/SSG, API routes, file-based routing, React Server Components |
| UI Library | React | 19.2 | ล่าสุด รองรับ React Compiler |
| Language | TypeScript (strict) | 5.x | Type safety เต็มรูปแบบ |
| Styling | TailwindCSS | 4.x | Utility-first CSS, v4 ใช้ CSS-first config (ไม่ต้องมี tailwind.config.js) |
| Component Library | Ant Design | 6.x | Table, Form, Modal, Drawer, DatePicker, Segmented — component สำเร็จรูป |
| State Management | Redux Toolkit | 2.11 | createSlice, createAsyncThunk, typed hooks |
| Form | react-hook-form + Controller | 7.71 | Controlled form state, validation rules, integration กับ Ant Design |
| HTTP Client | Axios | 1.13 | Interceptors สำหรับ auth tokens, auto-refresh, error handling |
| Session | iron-session | 8.0 | Encrypted HTTP-only cookie, ไม่ต้องมี session store แยก |
| Map | Mapbox GL + react-map-gl | 3.21 / 8.1 | Vector map, custom style, markers, GeoJSON layers |
| Charts | ECharts + echarts-for-react | 6.0 / 3.0 | Line, Bar, Pie, Gauge, Rose charts — dark theme compatible |
| Video Streaming | hls.js | 1.6 | HLS (.m3u8) live stream playback |
| Animation | Framer Motion | 12.38 | Layout animation สำหรับ expandable cards |
| Carousel | Swiper | 12.1 | Touch-friendly carousel สำหรับรูปกล้อง/ภาพรถ |
| Date | dayjs + buddhistEra + th locale | 1.11 | วันที่ภาษาไทย + พ.ศ. |
| Icons | react-icons/tb (Tabler) + @ant-design/icons | — | Tabler: ใช้ใน Navbar/Sidebar/Features, Ant: ใช้ใน form components |
| React Compiler | babel-plugin-react-compiler | 1.0.0 | Auto-memoization ใน `next.config.ts` (reactCompiler: true) |
| Storybook | @storybook/nextjs-vite | 10.2 | Component development, a11y testing, interaction tests |
| Linting | ESLint 9 (flat config) | — | `core-web-vitals` + `typescript` + storybook rules |
| CSS Processing | PostCSS + @tailwindcss/postcss | — | TailwindCSS v4 pipeline |

### Production Dependencies (19 ตัว)
```
@ant-design/icons, @ant-design/nextjs-registry, @reduxjs/toolkit, @types/mapbox-gl,
antd, axios, better-auth, dayjs, framer-motion, echarts, echarts-for-react,
hls.js, iron-session, mapbox-gl, next, react, react-dom, react-hook-form,
react-icons, react-map-gl, react-redux, recharts, swiper
```

> **หมายเหตุ**: `better-auth` อยู่ใน dependencies แต่ยังไม่มีการใช้งานจริงใน code — เพิ่มไว้สำหรับอนาคต
> **หมายเหตุ**: `recharts` อยู่ใน dependencies แต่ยังไม่มีการใช้งาน — ใช้ ECharts แทน

### Dev Dependencies (21 ตัว)
```
@chromatic-com/storybook, @storybook/addon-a11y, @storybook/addon-docs,
@storybook/addon-onboarding, @storybook/addon-vitest, @storybook/nextjs-vite,
@tailwindcss/postcss, @types/node, @types/react, @types/react-dom,
@vitest/browser-playwright, @vitest/coverage-v8, babel-plugin-react-compiler,
eslint, eslint-config-next, eslint-plugin-storybook, playwright,
storybook, tailwindcss, typescript, vite, vitest
```

---

## 2. การวางโครงสร้างโฟลเดอร์ — ทำไมวางแบบนี้

### หลักการออกแบบ

```
src/
├── app/          ← Next.js App Router — เฉพาะ routing + thin page shells
├── components/   ← Shared/reusable components — ใช้ข้าม feature ได้
├── configs/      ← Configuration — menu, theme, ไม่มี business logic
├── constants/    ← ค่าคงที่ domain — vehicle types, status codes, provinces
├── features/     ← Business logic หลัก — จัดตาม domain
│   ├── admin/    ←   domain ของ admin
│   │   ├── dashboard/   ←   feature "dashboard"
│   │   │   ├── screen/     ←   หน้าจอหลักของ feature (import โดย app/page.tsx)
│   │   │   ├── components/ ←   components ที่ใช้เฉพาะใน feature นี้
│   │   │   ├── context/    ←   React Context สำหรับ feature นี้
│   │   │   └── data/       ←   mock data / lookup tables ของ feature
│   ├── auth/     ←   domain ของ authentication
│   └── example/  ←   domain ของ example/demo
├── lib/          ← Library setup — session config
├── services/     ← API layer — Axios setup + route services
├── stores/       ← Redux — global state
├── styles/       ← CSS files — globals, component overrides, utilities
├── types/        ← TypeScript interfaces — shared types
└── utils/        ← Utility functions — hooks, helpers
```

### ทำไมแยก `app/` กับ `features/`?

- `app/page.tsx` เป็น **thin shell** — เขียนแค่ `import Screen from '@/features/...'` แล้ว render เท่านั้น
- business logic, state, components ทั้งหมดอยู่ใน `features/`
- ทำให้ย้าย routing ได้ง่าย (เปลี่ยน path ใน `app/` โดยไม่ต้องย้าย logic)
- feature สามารถทดสอบได้独立 (ใน Storybook หรือ unit test) โดยไม่ต้องผ่าน Next.js routing

### ทำไมมี `src/middleware.ts`?

- Next.js middleware อยู่ที่ `src/proxy.ts` แทน — export `proxy` แทน `middleware`
- เป็น convention เฉพาะโปรเจกต์นี้ (ตั้งชื่อแบบนี้เพื่อให้ CLAUDE.md อ้างอิงได้ชัด)

---

## 3. โครงสร้างไฟล์ทั้งหมดแบบละเอียด (ทุกไฟล์)

### 3.1 Root config files

| ไฟล์ | ทำอะไร | รายละเอียดสำคัญ |
|---|---|---|
| `package.json` | Project manifest | name: `drr-new-its-fe`, scripts: dev/build/start/lint/storybook/build-storybook |
| `next.config.ts` | Next.js configuration | `reactCompiler: true` (เปิด React Compiler auto-memoization), redirect `/` → `/auth/login` (302) |
| `tsconfig.json` | TypeScript config | `strict: true`, `target: ES2017`, `moduleResolution: bundler`, `jsx: react-jsx`, path alias `@/*` → `./src/*` |
| `postcss.config.mjs` | PostCSS plugins | เฉพาะ `@tailwindcss/postcss` (TailwindCSS v4 approach — ไม่ต้องมี tailwind.config.js) |
| `eslint.config.mjs` | ESLint 9 flat config | extends: `next/core-web-vitals` + `next/typescript` + `storybook/flat/recommended`, ลด `no-empty-object-type` เป็น warn |
| `vitest.config.ts` | Vitest config | ใช้แค่ `storybook` project — browser tests ผ่าน Playwright Chromium headless, setup file: `.storybook/vitest.setup.ts` |
| `globals.d.ts` | Global type declarations | ประกาศ `*.css` และ `*.module.css` เพื่อให้ TypeScript รู้จัก CSS imports |
| `CLAUDE.md` | AI assistant instructions | อธิบาย architecture, conventions, env vars — ให้ Claude Code อ่าน |
| `README.md` | Default Next.js readme | Boilerplate — ไม่ได้ใช้จริง |

### `.storybook/` config

| ไฟล์ | ทำอะไร |
|---|---|
| `.storybook/main.ts` | Storybook config — framework: `@storybook/nextjs-vite`, stories: `src/**/*.stories.@(js\|tsx)`, addons: Chromatic/Vitest/a11y/Docs/Onboarding, staticDirs: `public/` |
| `.storybook/preview.tsx` | Preview wrapper — ใส่ Ant Design `ConfigProvider` + project theme + global CSS รอบทุก story |
| `.storybook/vitest.setup.ts` | Vitest setup — applies Storybook + a11y annotations |

### `.vscode/`

| ไฟล์ | ทำอะไร |
|---|---|
| `.vscode/settings.json` | `editor.tabSize: 2` เท่านั้น |

---

### 3.2 `public/` — static assets

```
public/
├── file.svg, globe.svg, next.svg, vercel.svg, window.svg   # Next.js boilerplate (ไม่ได้ใช้)
│
├── data/
│   ├── th-provinces.geojson        # GeoJSON ขอบเขต 77 จังหวัดไทย (~550KB)
│   │                                 ใช้ render ใน ThailandMaskLayer บน map
│   └── thailand.geojson            # GeoJSON ขอบเขตประเทศไทย (~1MB)
│                                    ใช้ render ใน ThailandMaskLayer บน map
│
└── images/
    ├── icon-marker/
    │   ├── Moving.svg              # Map pin marker สีม่วงพิ้งค์ #EB66FF — ใช้สำหรับหน่วยเคลื่อนที่
    │   ├── Station.svg             # Map pin marker สีเขียว #66FF9E — ใช้สำหรับสถานีตรวจสอบน้ำหนัก
    │   └── Wim.svg                 # Map pin marker สีเหลือง #FCD116 — ใช้สำหรับ WIM
    │                                ทั้ง 3 ไฟล์: ขนาด 43x46px, pin shape, drop shadow
    │
    ├── statistics/
    │   ├── Frame1.png, Frame1.1.png, Frame1.2.png    # ไอคอน + detail icons สำหรับ "Incident Detection" card
    │   ├── Frame2.png, Frame2.1.png, Frame2.2.png    # ไอคอน + detail icons สำหรับ "Traffic Lighting" card
    │   └── Frame3.png, Frame3.1.png, Frame3.2.png    # ไอคอน + detail icons สำหรับ "VMS" card
    │                                                 ใช้ใน Statistics > Overview section
    │
    └── vehicles/
        ├── placeholder/
        │   └── truck-icon.svg       # ไอคอนรถบรรทุกตัวเดียว (~2MB, ควร optimize)
        │
        └── truck-img/
            ├── truck-type/          # รูปด้านข้างรถบรรทุกแต่ละประเภท
            │   ├── 01.svg - 21.svg           # ประเภท 1-21 (แต่ละไฟล์ ~1.3-2.3KB, viewbox 153x59)
            │   └── 11_1.svg - 11_4.svg       # ประเภท 11 มี 4 sub-variants (KingPin 4.50/6/7/8)
            │                                   เรียกผ่าน VEHICLE_PROPERTIES[type].vehicle.image
            │
            ├── wheel-type/           # รูปล้อแนวนอน
            │   ├── 01.svg - 21.svg           # SVG ขนาด ~43KB, viewbox 81x63, สี cyan/teal
            │   └── WheelHorizontal.js         # React component (~3.9MB!)
            │                                   Props: leftwheel1-7, rightwheel1-7, type (1-21), displayType
            │                                   switch/case แสดง wheel config พร้อมน้ำหนัก text overlay
            │
            └── wheel-vertical/     # รูปล้อแนวตั้ง
                ├── 01.svg - 21.svg           # SVG ขนาด ~44KB, viewbox 63x81
                └── WheelVertical.js           # React component (~4MB!) — โครงสร้างเดียวกับ Horizontal
```

---

### 3.3 `src/app/` — Next.js App Router

`app/` เป็น **thin shell layer** — ไฟล์ page.tsx แต่ละไฟล์แค่ import screen จาก `features/` แล้ว render

#### Root

| ไฟล์ | ทำอะไร | Import / Export |
|---|---|---|
| `layout.tsx` | Root layout — wraps ทุกหน้า | Google Fonts (Geist, Geist_Mono, IBM_Plex_Sans_Thai), AntdRegistry, StoreProvider, ConfigProvider with theme |
| `page.tsx` | `/` — Next.js boilerplate (ไม่ได้ใช้, redirect อยู่ใน next.config.ts) | — |

#### `app/auth/`

| ไฟล์ | ทำอะไร |
|---|---|
| `layout.tsx` | Auth layout — wraps ด้วย `LoginProvider`, มี `<header>Login Page</header>` + `<main>` |
| `login/page.tsx` | `/auth/login` — import และ render `AuthScreen` จาก `features/auth/login/screen` |

#### `app/admin/`

| ไฟล์ | ทำอะไร |
|---|---|
| `layout.tsx` | Admin layout — wraps ด้วย `PageLayout` (Navbar + Sidebar + PageProvider). ตรวจ `pathname === '/admin/dashboard'` เพื่อ skip top padding |
| `dashboard/page.tsx` | → `DashboardScreen` |
| `cctv/page.tsx` | → CCTV overview |
| `analytic/page.tsx` | → (ยังไม่มี feature screen) |
| `counting/page.tsx` | → (ยังไม่มี feature screen) |
| `crosswalk/page.tsx` | → (ยังไม่มี feature screen) |
| `lighting/page.tsx` | → (ยังไม่มี feature screen) |
| `vms/page.tsx` | → (ยังไม่มี feature screen) |
| `tunnel/page.tsx` | → (ยังไม่มี feature screen) |
| `wim/page.tsx` | → (ยังไม่มี feature screen) |
| `traffic/page.tsx` | → (ยังไม่มี feature screen) |
| `tracking/page.tsx` | → `TrackingScreen` (overall) |
| `tracking/detail/wim/[id]/page.tsx` | → WIM detail (dynamic route: `[id]`) |
| `tracking/detail/mobile/[id]/page.tsx` | → Mobile detail (dynamic route: `[id]`) |
| `statistics/page.tsx` | → `StatisticsScreen` |
| `settings/page.tsx` | → (ยังไม่มี feature screen) |
| `monitoring/page.tsx` | → (ยังไม่มี feature screen) |
| `test/page.tsx` | → `TestScreen` (chart playground) |

#### `app/example/`

| ไฟล์ | ทำอะไร |
|---|---|
| `layout.tsx` | Example layout — PageLayout + ExampleProvider |
| `example/page.tsx` | → `ExampleScreen` |
| `form/page.tsx` | → `FormScreen` |
| `table/page.tsx` | → `TableScreen` |

#### `app/api/auth/[...all]/route.ts`

Catch-all API route สำหรับ authentication:

| Method | Sub-path | ทำอะไร |
|---|---|---|
| `GET` | `session` | อ่าน `access_token`, `refresh_token` จาก iron-session ส่งเป็น JSON |
| `POST` | `login` | รับ body → `axios.post` ไป backend `/auth/login` → เก็บ tokens + role ใน session |
| `POST` | `logout` | `axios.post` ไป backend `/auth/logout` → `session.destroy()` |
| `POST` | `refresh` | รับ body `{ refresh_token }` → `axios.post` ไป backend `/auth/refres` → update tokens |

---

### 3.4 `src/components/` — shared components

```
components/
├── chart/
│   ├── GaugeChart.tsx           # เข็มวัดความเร็ว (ECharts gauge)
│   ├── LineChart.tsx            # เส้น line chart (multiple series + stats row)
│   ├── PieChart.tsx             # วงกลม pie chart (center label + legend)
│   ├── PieChartAll.tsx          # หลาย donut gauges เรียงกัน (สถานะออนไลน์)
│   ├── ฺBarchart.tsx            # แท่ง bar chart (multiple bars per group)
│   ├── PieChart.stories.tsx     # Storybook story
│   └── ฺBarChart.stories.tsx    # Storybook story
│
├── icon/
│   └── Icon.tsx                 # (empty placeholder — ว่างไว้)
│
├── layout/
│   ├── Layout.tsx               # PageLayout — Navbar + Sidebar + PageProvider
│   ├── Navbar.tsx               # Fixed top navbar (trapezoid nav)
│   ├── Sidebar.tsx              # Ant Design Drawer sidebar
│   └── sidebar/
│       ├── index.ts             # Barrel export
│       ├── SidebarHeader.tsx    # Avatar + clock
│       ├── SidebarContent.tsx   # Menu list (active = yellow bg)
│       └── SidebarFooter.tsx    # Logout button
│
├── list/
│   ├── CardList.tsx             # Expandable card grid
│   └── index.ts                 # (empty)
│
├── map/
│   ├── BaseMap.tsx              # Configurable map (children pattern)
│   ├── ReactMap.tsx             # Full-screen Thailand map
│   ├── Map.tsx                  # Alternative map
│   ├── MapContext.tsx           # Map context provider
│   ├── hooks/useMap.ts          # Map hook
│   ├── BaseMap.stories.tsx      # Storybook story
│   ├── markers/
│   │   ├── DeviceClusterMarker.tsx         # Cluster markers สำหรับ devices
│   │   ├── StchSummaryMarker.tsx           # STCH summary overlay markers
│   │   ├── ThailandMaskLayer.tsx           # GeoJSON boundary fill (Thailand + provinces)
│   │   ├── TrackingOverviewMarker.tsx      # Colored pin markers (WIM=yellow, Mobile=purple, Station=green)
│   │   └── TrackingOverviewMarker.stories.tsx  # Storybook story
│   ├── overlays/
│   │   ├── BreadcrumbBanner.tsx             # Breadcrumb navigation บน map
│   │   └── SystemFilterPills.tsx            # System type filter buttons บน map
│   └── primitives/
│       ├── HTMLMarker.tsx                   # HTML element as map marker (react-map-gl API)
│       ├── HTMLMarker.stories.tsx           # Storybook story
│       ├── MarkerLayer.tsx                  # Layer of markers
│       ├── MarkerLayer.stories.tsx          # Storybook story
│       └── popupHelper.ts                   # Popup positioning/formatting utilities
│
├── provider/
│   ├── ContextProvider.tsx       # PageContext — shared context สำหรับ admin pages
│   └── StoreProvider.tsx         # Redux Provider wrapper
│
├── searchable/
│   └── SearchBar.tsx            # Filter bar (all/normal/overweight) + view mode + export
│
├── search-card/
│   ├── SearchCard.tsx            # Search input card (yellow theme)
│   └── index.ts                  # Barrel export
│
├── swap-button/
│   ├── SwapButton.tsx            # Tab button group
│   └── SwapButton.stories.tsx    # Storybook story
│
└── video/
    ├── HLSLivePlayer.tsx         # HLS live video player (~970 lines)
    └── HLSLivePlayer.stories.tsx # Storybook story
```

---

### 3.5 `src/configs/` — configuration

```
configs/
├── antd/
│   └── themeConfig.ts            # Ant Design theme tokens
│
└── menu/
    ├── index.ts                  # menu: { ADMIN: admin[], EXAMPLE: example[] }
    ├── admin.ts                  # 14 admin menu items with icons
    └── example.ts                # 2 example menu items
```

#### `configs/antd/themeConfig.ts`

Ant Design theme configuration — **dark mode theme**:

```
Token:
  fontFamily: var(--font-ibm-plex-sans-thai)
  colorPrimary: #FCD116 (yellow)
  colorTextLightSolid: var(--dark-black)

Component overrides:
  Card       — bg: dark-black, text: white
  Button     — ghost border: yellow
  Drawer     — bg: dark-black, text: white, split: white
  Input      — border: yellow, bg: transparent, text: white, placeholder: 50% white
  DatePicker — same as Input + dropdown panel: dark, cell hover: #2A2A2A
  Segmented  — track: #1A1A1A, selected: yellow bg + dark text
  Table      — header: yellow bg + black text, body: #191919 + white, row hover: #2A2A2A
```

#### `configs/menu/admin.ts`

14 menu items สำหรับ role ADMIN:

| # | Key | Label | Icon (Tabler) | Path |
|---|---|---|---|---|
| 1 | 1 | Dashboard | `TbLayoutDashboard` | `/admin/dashboard` |
| 2 | 2 | CCTV | `TbVideo` | `/admin/cctv` |
| 3 | 3 | Analytic | `TbCar` | `/admin/analytic` |
| 4 | 4 | Counting | `TbTruckDelivery` | `/admin/counting` |
| 5 | 5 | Traffic | `TbTrafficLights` | `/admin/traffic` |
| 6 | 6 | Crosswalk | `TbWalk` | `/admin/crosswalk` |
| 7 | 7 | Lighting | `TbBolt` | `/admin/lighting` |
| 8 | 8 | VMS | `TbDeviceDesktop` | `/admin/vms` |
| 9 | 9 | Tunnel | `TbBuildingBridge` | `/admin/tunnel` |
| 10 | 10 | WIM | `TbBuildingBridge2` | `/admin/wim` |
| 11 | 11 | Tracking | `TbTopologyStar3` | `/admin/tracking` |
| 12 | 12 | Statistics | `TbChartBar` | `/admin/statistics` |
| 13 | 13 | Settings | `TbAdjustmentsHorizontal` | `/admin/settings` |
| 14 | 14 | Monitoring | `TbBriefcase` | `/admin/monitoring` |

แต่ละ item: `{ key, title, label, label_key, icon (string), default_color_icon, path, path_active, path_list }`

**วิธีการทำงานของ icon**: Navbar และ Sidebar มี `ICON_LIST: Record<string, Component>` ที่ map string name → React component. เวลาเพิ่ม menu item ใหม่ ต้องเพิ่ม icon เข้าไปใน `ICON_LIST` ทั้ง Navbar.tsx และ SidebarContent.tsx ด้วย

---

### 3.6 `src/constants/` — domain constants

#### `constants/vehicle.ts` — ไฟล์ใหญ่ที่สุดใน project

| Constant | Type | Description |
|---|---|---|
| `VEHICLE_PROPERTIES` | `Record<string, VehicleConfig>` | ประเภทรถบรรทุก 1-21 + 99 (อื่นๆ). แต่ละ type มี: `vehicle` (image + width + height), `wheel_vertical`, `wheel`, `properties` (type, description, top/bottom text), `axle` (gap + layout array) |
| `WEIGHT_STATUS` | `Record<string, string>` | Y = "น้ำหนักเกิน", N = "ปกติ", P = "รถน้ำหนักเกิน (เพลาเกิน)" |
| `WEIGHT_STATUS_WITH_PROPERTIES` | `Record<string, { text, color }>` | N = เขียว #56E4EE, Y/P = แดง #FF4A4A |
| `RECENT_WEIGHT_STATUS` | `Record<string, { description, color, fontColor }>` | 0 = ปกติ/เขียว, 1 = เกิน/เหลือง, 2 = เกิน 10%/แดง |
| `STATION_TYPE` | `Record<string, string>` | spot/wim/station → ชื่อภาษาไทย |
| `STATION_CODE` | `Record<string, string>` | 1/2/3 → ชื่อภาษาไทย |
| `CAMERA_TYPE` | `Record<string, string>` | fixed → "FIXED", PTZ → "PTZ" |
| `REMARK` | `Record<string, string>` | ON/OFF → ออนไลน์/ออฟไลน์ |
| `OPTION_MONTH` | `Array<{ label, value }>` | เดือนภาษาไทย มกราคม-ธันวาคม (value: "1"-"12") |
| `ROLE_TH` | `Record<string, string>` | ADMIN/USER → ผู้ดูแลระบบ/ผู้ใช้งาน |
| `ROLE_TH_UNCAP` | `Record<string, string>` | Admin/User → ผู้ดูแลระบบ/ผู้ใช้งาน |
| Error messages | string constants | ERROR_MESSAGE_SOMETHING_WENT_WRONG, ERROR_MESSAGE_INTERNAL_SERVER_ERROR, API_GET/POST/PUT/PATCH/DELETE_DATA_SUCCESS |

#### `constants/index.ts`

Re-exports ทุกอย่างจาก `vehicle.ts`:
```ts
export * from "./vehicle"
```

---

### 3.7 `src/features/` — feature modules

```
features/
├── admin/
│   ├── dashboard/               # หน้า Dashboard — map + overlay panels
│   │   ├── screen/index.tsx     # หน้าจอหลัก (full-screen map + desktop/mobile layouts)
│   │   ├── context/index.tsx    # DashboardContext (provider, ยังไม่มี context values)
│   │   ├── components/
│   │   │   ├── index.ts         # Barrel export 7 components
│   │   │   ├── AccidentChart.tsx   # Line chart — ปริมาณอุบัติเหตุรายเดือน (ECharts)
│   │   │   ├── Notification.tsx    # Alert card — "แจ้งเตือนด่วน 74" (full + compact mode)
│   │   │   ├── RatioChart.tsx      # 7 donut gauges — % online ของแต่ละระบบ IoT (ECharts)
│   │   │   ├── StatusChart.tsx     # 3 stat cards — กล้องทั้งหมด/จุดติดตั้ง/สายทาง
│   │   │   ├── Tabs.tsx            # Reusable tab component (pill buttons)
│   │   │   ├── TrafficStat.tsx     # Traffic stat card — ช่วงเวลาคับจราจรสูงสุด
│   │   │   └── VehicleRatioChart.tsx # Rose/polar chart — สัดส่วนยานพาหนะ + legend
│   │   └── data/
│   │       ├── mockDevices.ts     # (stub — IncidentSection placeholder)
│   │       ├── provinces.ts       # 77 จังหวัด: { code, name, stch, coord, central? }
│   │       ├── systems.ts         # 10 ระบบ IoT: { color, label, icon }
│   │       └── units.ts           # 100 หน่วยงาน: 18 สทช. + 77 ขทช. + 5 บทช.
│   │
│   ├── cctv/                     # หน้า CCTV
│   │   ├── screen/
│   │   │   ├── overview/index.tsx   # ใช้ SearchBar component
│   │   │   └── detail/index.tsx     # placeholder
│   │
│   ├── statistics/               # หน้า Statistics
│   │   ├── screen/index.tsx       # 4 tabs: overview/incident/alert/status
│   │   └── components/
│   │       ├── index.ts             # Barrel export 4 sections
│   │       └── sections/
│   │           ├── overview/index.tsx   # 3 large cards (585×740px)
│   │           ├── incident/index.tsx   # placeholder
│   │           ├── alert/index.tsx       # placeholder
│   │           └── status/index.tsx     # Map + SearchCard + Collapse + sub-tabs
│   │
│   ├── test/                     # หน้า Chart playground
│   │   └── screen/index.tsx       # แสดงทุก chart component
│   │
│   └── tracking/
│       ├── overall/               # หน้า Tracking หลัก (6 tabs)
│       │   ├── screen/index.tsx       # Tab switcher (OVERALL/STATION/WIM/MOBILE/GPS/LICENSE)
│       │   ├── components/
│       │   │   ├── index.ts             # Barrel export ทุก component
│       │   │   ├── TitleSection.tsx      # SwapButton tabs
│       │   │   ├── OverallSection.tsx    # Overview tab layout
│       │   │   ├── StationSection.tsx    # placeholder
│       │   │   ├── WIMSection.tsx        # WIM tab: map + table
│       │   │   ├── MobileSection.tsx     # Mobile tab: images + map + table
│       │   │   ├── GPSSection.tsx        # placeholder
│       │   │   └── LicenseSection.tsx    # placeholder
│       │   └── data/
│       │       └── trackingStations.ts  # 14 mock stations (8 WIM, 3 Station, 2 Mobile)
│       │
│       └── detail/
│           ├── wim/                  # หน้า WIM Detail
│           │   ├── screen/index.tsx
│           │   └── components/         # TitleSection, CCTVSection, OverallSection, VehicleSection
│           │       ├── index.ts
│           │       ├── TitleSection.tsx
│           │       ├── CCTVSection.tsx
│           │       ├── OverallSection.tsx
│           │       │   ├── CardCurrentWeightVehicle.tsx
│           │       │   ├── CardDailyOverweight.tsx
│           │       │   ├── CardDailyWeight.tsx
│           │       │   ├── OverallAvgSpeed.tsx
│           │       │   ├── OverallCalibrateWeight.tsx
│           │       │   ├── OverallCCTV.tsx
│           │       │   ├── OverallDailyWeightList.tsx
│           │       │   ├── OverallMap.tsx
│           │       │   ├── OverallStatCard.tsx
│           │       │   ├── OverallWeightStat.tsx
│           │       │   └── OverallDataDisplaySection.tsx
│           │       │       └── TableOverallWeight.tsx, TableOverallDailyWeight.tsx
│           │       └── VehicleSection.tsx
│           │           └── FormSearchVehicle.tsx, ModalVehicleData.tsx,
│           │               TableVehicleData.tsx, VehicleStatCard.tsx
│           │
│           └── mobile/               # หน้า Mobile Detail
│               ├── screen/index.tsx
│               └── components/         # โครงสร้างเดียวกับ WIM
│                   ├── OverallSection.tsx (MobileDailyWeightList, MobileDetailCard,
│                   │   MobileDetailImage, MobileStatCard, OverallDataDisplaySection,
│                   │   TableMobileDailyWeight)
│                   └── VehicleSection.tsx (เดียวกับ WIM)
│
├── auth/login/                    # หน้า Login
│   ├── screen/index.tsx           # Login form (react-hook-form + axios)
│   └── context/index.tsx          # LoginContext provider
│
└── example/                       # หน้า Demo
    ├── example/
    │   ├── screen/index.tsx       # Redux async thunk demo
    │   └── context/index.tsx      # ExampleContext provider
    ├── form/
    │   ├── screen/index.tsx       # Form type switcher
    │   └── components/
    │       ├── FormSearch.tsx      # Auto-submit search (700ms debounce)
    │       └── FormSubmit.tsx      # Full form (DatePicker, Select, validation)
    └── table/
        └── screen/index.tsx       # Ant Table demo
```

---

### 3.8 `src/lib/` — library setup

#### `lib/defaultSession.ts`

iron-session configuration:

```ts
interface SessionData {
  access_token: string;
  refresh_token: string;
  role: "EXAMPLE" | "ADMIN" | "";
}

sessionOptions: {
  password: process.env.TOKEN_SECRET,
  cookieName: "DRR_ITS",
  cookieOptions: {
    secure: true (production),   // false in dev
    httpOnly: true,              // XSS protection
    maxAge: 30 days,             // 60 * 60 * 24 * 30
    sameSite: 'strict',          // CSRF protection
  }
}
```

---

### 3.9 `src/services/` — API layer

```
services/
├── BaseService.ts               # Axios instance + interceptors
├── ApiService.ts                 # Typed fetchData wrapper
├── RtkQueryService.ts            # RTK Query base (not actively used)
└── routes/
    ├── AdminService.ts           # Admin API: getAdminAPI() → GET /auth/me
    └── ExampleService.ts         # Example API: getExampleAPI() → GET /auth/me
```

#### `BaseService.ts` — ใจกที่สุดใน service layer

```
Axios Instance:
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND
  timeout: 60,000ms (60s)

Request Interceptor:
  1. fetch("/api/auth/session") → ดึง access_token
  2. ถ้ามี token → config.headers["Authorization"] = "Bearer {token}"
  3. config.headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
  4. console.log("[REQ]", url, params, method)

Response Interceptor (Error Handling):
  - res_code === 40199 (TOKEN_EXPIRED):
    → Modal.confirm "Session Expired" → Refresh or Logout
    → Refresh: POST /api/auth/refresh → retry original request
    → Logout: POST /api/auth/logout → redirect /auth/login
    → มี config._retry flag ป้องกัน infinite retry loop

  - res_code === 40100 (TOKEN_INVALID):
    → Modal.error "Session Invalid" → force logout

  - HTTP 401:
    → auto logout (ไม่ถาม, redirect เลย)

  - logout helper function:
    → POST /api/auth/logout → window.location.href = "/auth/login"
```

#### `ApiService.ts`

Typed wrapper รอบ BaseService:
```ts
ApiService.fetchData<Response, Request>(config: AxiosRequestConfig)
  → Promise<AxiosResponse<Response>>
```

#### `RtkQueryService.ts`

RTK Query base service — สร้างไว้แต่ **ยังไม่ได้ใช้งาน** ใน project (ใช้ Redux createAsyncThunk แทน)

---

### 3.10 `src/stores/` — Redux Toolkit

```
stores/
├── store.ts                     # makeStore() → configureStore
├── hooks.ts                     # useAppDispatch, useAppSelector, useAppStore (typed)
└── reducers/
    ├── index.ts                 # rootReducer = { example, admin, auth, layout }
    ├── auth/authSlice.ts        # Auth token state
    ├── admin/adminSlice.ts      # Admin data + async thunk
    ├── example/exampleSlice.ts  # Example data + async thunk
    └── layout/layoutSlice.ts    # Layout state (drawer, loading)
```

#### Slice ละเอียด

**authSlice** (`SLICE_NAME = 'authSlice'`):
```
State: { auth_token: { access_token: string | null, refresh_token: string | null } }
Actions: setAuthToken(tokens), resetAuthToken()
Pattern: sync reducers only (ไม่มี async thunk)
```

**adminSlice** (`SLICE_NAME = 'adminSlice'`):
```
State: { me: { user_id: string }, task_schedules: { me: PromiseProperties } }
Thunks: getAdminData → GET /auth/me
  pending → loading=true, status=LOADING
  fulfilled → state.me = payload, loading=false, status=SUCCESS
  rejected → loading=false, status=FAILED
Actions: setMe(data), resetMe()
```

**exampleSlice** (`SLICE_NAME = 'exampleSlice'`):
```
State: { me: { user_id: string }, task_schedules: { me: PromiseProperties } }
Thunks: getExampleData → GET /auth/me (same endpoint, for demo)
Actions: setMe(data), resetMe()
```

**layoutSlice** (`SLICE_NAME = 'layoutSlice'`):
```
State: { task_schedules: PromiseProperties, drawer: { open: boolean } }
Actions:
  setTaskSchedule({ loading, status })  — ใช้ใน login form (global loading)
  resetTaskSchedule()
  setDrawerOpen({ open })              — เปิด/ปิด sidebar drawer
  resetDrawerOpen()
```

---

### 3.11 `src/styles/` — CSS files

| ไฟล์ | ทำอะไร | รายละเอียดสำคัญ |
|---|---|---|
| `globals.css` | Root CSS | `@import "tailwindcss"` + 4 CSS imports, `:root` variables (12 ตัว), font smoothing, h1-h6 responsive clamp, scrollbar styling, Mapbox logo hide, utility classes |
| `antd.css` | Ant Design overrides | Table scrollbar styling (6px, dark bg, #444 thumb) |
| `custom.css` | Utility classes | `.figure-extra-large/large/normal/small` (responsive height clamps), `.fs-24/22/18/14/12` (responsive font sizes) |
| `layout.css` | Layout CSS | `.navbar` (fixed, z-1000, scrolled state with blur bg), `.nav-container` (flex, 48px min-height), `.main-screen` (100% width+height), mobile breakpoint @900px |
| `map.css` | Map layout CSS | `.location-section` (flex, 640px height), `.camera-list` (280px width, scrollbar), `.map-wrapper` (flex:1), `.search-panel` (280px), `.filter-bar` (absolute overlay), responsive @768px → column stack |
| `swiper.css` | Swiper overrides | `.page-swiper` slide styling (responsive height clamps, object-fit cover), `.swiper-fill` variant (height: 100% follow parent) |

---

### 3.12 `src/types/` — TypeScript interfaces

| ไฟล์ | Interfaces |
|---|---|
| `shared.ts` | `PromiseProperties { loading, status: 'IDLE'\|'LOADING'\|'SUCCESS'\|'FAILED' }`, `APIActionResponse { message }` |
| `auth.ts` | `AuthState { auth_token: AuthToken }`, `AuthToken { access_token, refresh_token }` |
| `admin.ts` | `AdminState { me: AdminMe, task_schedules: AdminTaskSchedule }`, `AdminMe { user_id }` |
| `example.ts` | `ExampleState` — same shape as AdminState |
| `layout.ts` | `LayoutState { task_schedules: PromiseProperties, drawer: { open } }` |

---

### 3.13 `src/utils/` — utility functions

| ไฟล์ | ทำอะไร |
|---|---|
| `allowAdmin.ts` | (empty — placeholder) |
| `hooks/useGetSession.ts` | Server-side session reader — `getCookieSession()` → อ่าน iron-session จาก cookies (ใช้ใน Server Components) |
| `hooks/useTimeoutModal.ts` | Client-side hook — `useTimeoutModal()` → returns `{ showTimeoutModal(error, onOk, onCancel), contextHolder }` — แสดง Modal.confirm เมื่อ session expired |

---

### 3.14 `src/proxy.ts` — middleware

**ชื่อไฟล์พิเศษ**: ไฟล์นี้ export `proxy` แทน `middleware` — Next.js จะหา `middleware` export จากไฟล์นี้

```
Logic:
1. อ่าน session จาก iron-session cookie
2. ตรวจ isAuthenticated = !!session.access_token
3. ดึง menu ตาม role → menu[session.role as keyof typeof menu]
4. ถ้า login อยู่ + path เริ่มด้วย /auth/login → redirect ไป path[0].path (หน้าแรกของ role)
5. ถ้ายังไม่ login + path ไม่ได้เริ่มด้วย /auth/login → redirect ไป /auth/login
6. ถ้าผ่านเงื่อนไขทั้งหมด → response.next()

Matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
→ ทำงานทุก path ยกเว้น: api routes, static files, images, favicon
```

---

### 3.15 `src/stories/` — Storybook

Default Next.js Storybook boilerplate:
- `Button.tsx`, `Header.tsx`, `Page.tsx` + ตามด้วย `.stories.ts` + `.css`

---

## 4. Data Flow Diagrams

### 4.1 Auth flow

```
User opens browser
     │
     ▼
middleware (proxy.ts)
     │
     ├─ no session → redirect /auth/login
     │
     └─ has session → allow request
                            │
                            ▼
                    ┌───────────────┐
                    │  Page Layout   │
                    │  (Navbar +     │
                    │   Sidebar)     │
                    └───────────────┘


User submits login form
     │
     ▼
AuthScreen (features/auth/login/screen)
     │
     ├─ dispatch(setTaskSchedule(LOADING))  →  show loading spinner
     │
     ├─ axios.post('/api/auth/login', { username, password })
     │      │
     │      ▼
     │   API Route Handler (app/api/auth/[...all]/route.ts)
     │      │
     │      ├─ axios.post to backend /auth/login
     │      │
     │      └─ response 200 → session.save() { access_token, refresh_token, role }
     │                              │
     │                              ▼
     │                         iron-session cookie "DRR_ITS"
     │
     ├─ success → message.success() + router.push(first menu path)
     │
     └─ error → modal.error(error.response.data)
```

### 4.2 API request flow

```
Component calls service function
     │
     ▼
AdminService.getAdminAPI()
     │
     ▼
ApiService.fetchData<AdminMe>({ url: '/auth/me', method: 'GET' })
     │
     ▼
BaseService (Axios instance)
     │
     ├─ Request Interceptor:
     │   ├─ fetch("/api/auth/session") → get access_token from cookie
     │   ├─ headers["Authorization"] = "Bearer {token}"
     │   └─ headers["x-api-key"] = NEXT_PUBLIC_API_KEY
     │
     ├─ Send to backend
     │      │
     │      ▼
     │   Backend API (https://api-go.enixma.net/api)
     │      │
     │      ├─ 200 OK → return response data
     │      │
     │      └─ Error response
     │           │
     │           ▼
     │   Response Interceptor:
     │   ├─ res_code 40199 (expired) → Modal: Refresh or Logout
     │   │   ├─ Refresh → POST /api/auth/refresh → retry original request
     │   │   └─ Logout → POST /api/auth/logout → redirect /auth/login
     │   ├─ res_code 40100 (invalid) → Modal.error → force logout
     │   └─ HTTP 401 → auto logout
     │
     └─ Return to caller
```

### 4.3 Redux data flow

```
Component dispatches thunk
     │
     ▼
dispatch(getAdminData())
     │
     ▼
createAsyncThunk → pending
     │
     ├─ adminSlice → task_schedules.me.loading = true
     └─ layoutSlice → (can also use setTaskSchedule for global loading)

     │
     ▼
API call (via AdminService)
     │
     ├─ fulfilled → adminSlice.me = data, status = SUCCESS
     └─ rejected → status = FAILED

Component reads state:
     │
     ▼
const { me } = useAppSelector(state => state.admin)
const dispatch = useAppDispatch()
```

### 4.4 Page render flow

```
URL: /admin/dashboard
     │
     ▼
next.config.ts: redirect / → /auth/login (only for /)
(middleware runs first — checks session)

     │
     ▼
app/admin/layout.tsx  (server component)
     │
     └─ renders <PageLayout>
           │
           ├─ <Navbar />
           ├─ <Sidebar />
           └─ <PageProvider>
                 │
                 └─ {children} → app/admin/dashboard/page.tsx
                       │
                       └─ import DashboardScreen from features/admin/dashboard/screen
                             │
                             └─ "use client" — mounts on client
                                   │
                                   ├─ dispatch(getExampleData())
                                   ├─ useIsDesktop() hook
                                   └─ renders map + overlay panels
```

---

## 5. Environment Variables

| Variable | Client/Server | Default | ใช้ที่ไหน |
|---|---|---|---|
| `NEXT_PUBLIC_API_KEY` | Client | — | `x-api-key` header ทุก request (BaseService interceptor) |
| `NEXT_PUBLIC_HOST_BACKEND` | Client | `https://api-go.enixma.net/api` | Axios baseURL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client | — | Mapbox GL access token (ReactMap, BaseMap) |
| `TOKEN_SECRET` | Server only | `a7b9c3d2...` | iron-session cookie encryption password |
| `NODE_ENV` | Both | `development` | Controls session security (secure cookie), behavior flags |

**หมายเหตุ**: ทุก env ที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูก expose ไปที่ client-side bundle — สามารถ inspect ได้จาก browser

---

## 6. Routing

ดูรายละเอียดเต็มใน [section 3.3](#33-srcapp----nextjs-app-router)

---

## 7. Feature Modules แบบละเอียด

### 7.1 Dashboard (`/admin/dashboard`)

**File**: `features/admin/dashboard/screen/index.tsx`

**React Hook: `useIsDesktop()`**
- `useState<boolean | null>(null)` — เริ่มเป็น null (ยังไม่รู้), update ตอน mount
- ใช้ `window.matchMedia("(min-width: 1024px)")` + event listener
- ทำให้ mount เฉพาะ layout ที่ใช้ (ป้องกัน ECharts วัด dimension 0 จาก hidden DOM)

**Desktop Layout** (full-screen map + absolute panels):
```
┌──────────────────────────────────────────────────────────────────────┐
│ Navbar (fixed, 48px)                                                │
├──────┬───────────────────────────────────────────────┬───────────────┤
│      │                                               │               │
│ Left │           Map (full screen)                   │    Right      │
│ Side │                                               │    Side       │
│      │                                               │               │
│ Stats│                                               │ Notification │
│ Cards│                                               │ ───────────── │
│      │                                               │ VehicleRatio │
│ Line │                                               │ Chart        │
│Chart │                                               │ ───────────── │
│      │                                               │ TrafficStat  │
├──────┴───────────────────────────────────────────────┴───────────────┤
│ Donut gauges (7 items: CCTV, Lighting, VMS, WIM, CrossWalk, Bridge,   │
│                   Tunnel)                                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Mobile Layout** (map + scroll):
```
┌──────────────────────┐
│ Navbar (48px)        │
│ Notification pill    │ ← absolute right
├──────────────────────┤
│                      │
│   Map (60vh)         │
│                      │
├──────────────────────┤
│ Scrollable cards:    │
│   StatusChart        │
│   AccidentChart      │
│   VehicleRatioChart  │
│   RatioChart (4col)  │
│   TrafficStat        │
└──────────────────────┘
```

**Charts** — ทั้งหมดใช้ `dynamic(() => import('echarts-for-react'), { ssr: false })`:
- `AccidentChart`: Line chart — 12 เดือน, smooth curve, markPoint at max, yellow color
- `RatioChart`: 7 Gauge/Donut charts — % online ของแต่ละระบบ (สีต่างกัน)
- `VehicleRatioChart`: Rose/Polar chart — 7 ประเภทยานพาหนะ + total row

### 7.2 Tracking Overall (`/admin/tracking`)

**6 Tabs via SwapButton**:
1. **OVERALL**:
   - `LocationSection`: 3-column layout
     - Left: Camera list (3 mock cameras, HLSLivePlayer) + Swiper (mobile)
     - Center: BaseMap + ThailandMaskLayer + TrackingOverviewMarker + Filter pills
     - Right: (hidden, เฉพาะ WIM/Mobile tabs)
   - `VehicleStatSection`: 4-column grid stat cards (รวม/สถานี/WIM/เคลื่อนที่)
   - `ChartSection`: placeholder

2. **WIM**:
   - `WIMLocationSection`: 3-column layout (CCTV list + map + search panel)
   - `WIMSearchPanel`: FormSearchWIM + WIMInfoCard (6 stat cards)
   - `TableWIM`: 12 columns, mock 5 rows, row click → `/admin/tracking/detail/wim/EXAMPLE_WIM_ID`

3. **MOBILE**:
   - `MobileLocationSection`: 3-column layout (station images + map + search panel)
   - `MobileSearchPanel`: FormSearchMobile + MobileInfoCard (6 stat cards)
   - `TableMobile`: same structure as TableWIM

4-6. **STATION / TRACK_GPS / LICENSE**: placeholder

### 7.3 Statistics (`/admin/statistics`)

**Main screen**: SwapButton tabs + Segmented period filter + content area

**Overview section**: 3 cards ขนาด 585×740px:
- Card 1: Incident Detection (97,895) — glow blue, detail: ประเภทเหตุที่พบบ่อย + หน่วยงานที่มีเหตุมาก
- Card 2: Traffic Lighting (37,027) — glow green
- Card 3: VMS (415) — glow yellow-green

**Status section**: มี back button → กลับ overview, sub-tabs:
- Overview: BaseMap + SearchCard + Ant Collapse (8 สทช. routes)
- Comparison: placeholder

---

## 8. Map System

ดูโครงสร้างเต็มใน [section 3.4](#34-srccomponents----shared-components)

**การใช้งาน**:
- `ReactMap` — full-screen map สำหรับ Dashboard (dark style, centered Thailand)
- `BaseMap` — configurable map สำหรับ feature อื่นๆ (รับ `initialCenter`, `initialZoom`, `children`)
- `ThailandMaskLayer` — ใส่ใน BaseMap children → render GeoJSON fill overlay
- `TrackingOverviewMarker` — ใส่ใน BaseMap children → render colored pins + popup

---

## 9. Shared UI Components

ดูโครงสร้างเต็มใน [section 3.4](#34-srccomponents----shared-components)

### Component Specs แบบละเอียด

**HLSLivePlayer** (~970 lines):
- Props: `hlsUrl, figureClassName, videoClassName, videoStyle, muted, autoPlay, showLiveBadge, cameraId, enableViewportPause, viewportThreshold, maxRetries, retryDelay, autoReconnectInterval, onStatusChange, onError, onVisibilityChange`
- Ref API: `retry()`, `getStatus()`, `isConnected()`, `isPlaying()`, `isPaused()`, `getCameraId()`
- States: `isLoading, hasError, isPlaying, retryCount, errorMessage, connectionStatus (connecting/connected/retrying/error/failed), isPausedByViewport, isInViewport, isReconnecting, lastFrameUrl`
- Auto-detect HLS vs direct video from URL extension (.m3u8)
- HLS config: ABR, buffering, timeout, recovery, progressive loading
- Viewport pause: IntersectionObserver, destroy HLS instance when out of view, capture last frame to canvas

**CardList** (~309 lines):
- Props: `data (DataType[]), columns ({base,sm,lg,xl}), expandedColSpan, statusMap, onExpand, defaultExpandedId`
- DataType: `{ id, plate, vehicleType, status, actualWeight, stdWeight, overweight, laneAcceptance, speed, datetime, images[], vehicleImage }`
- Animation: Framer Motion `layout` + `AnimatePresence` for expand/collapse
- Grid: TailwindCSS grid with responsive columns

---

## 10. Types & Interfaces

ดูเต็มใน [section 3.12](#312-srctypes----typescript-interfaces)

---

## 11. Constants

ดูเต็มใน [section 3.6](#36-srcconstants----domain-constants)

---

## 12. Styles

ดูเต็มใน [section 3.11](#311-srcstyles----css-files)

---

## 13. Storybook

- Framework: `@storybook/nextjs-vite`
- Port: 6006 (`npm run storybook`)
- Stories location: `src/**/*.stories.@(js|jsx|mjs|ts|tsx)` + `src/**/*.mdx`
- Addons: Chromatic, Vitest, a11y, Docs, Onboarding
- Preview: wraps in `ConfigProvider` with theme
- Vitest: Playwright Chromium headless for interaction tests

---

## 14. Conventions & Patterns

### ทุก component ต้องมี:
- `"use client"` directive (ถ้าใช้ hooks/Redux/browser APIs)
- `React.memo<Props>(Component)` wrapper
- `interface Props` definition

### Form pattern:
```tsx
const form = useForm<FormValues>({ defaultValues: { ... } })
const { control, handleSubmit, formState: { errors } } = form

<Controller
  control={control}
  name="fieldName"
  rules={{ required: 'กรุณากรอก' }}
  render={({ field }) => (
    <Input {...field} />
  )}
/>
```

### API service pattern:
```tsx
// 1. สร้าง typed interface
interface APIResponse { ... }

// 2. สร้าง service function
export const getXxxAPI = async () => {
  return ApiService.fetchData<APIResponse>({
    url: '/endpoint',
    method: 'GET',
  })
}

// 3. สร้าง Redux thunk
export const getXxxData = createAsyncThunk('xxx/API', async () => {
  const response = await getXxxAPI()
  return response.data
})
```

### Error handling pattern:
- ใช้ `Modal.error()`, `Modal.confirm()`, `message.success()` — ไม่ใช้ inline validation messages
- มี `contextHolder` จาก `Modal.useModal()` ใส่ใน JSX

### Styling pattern:
- TailwindCSS utilities สำหรับ layout, spacing, colors
- `style={{ ... }}` สำหรับ dynamic values (คำนวณจาก data)
- CSS custom properties (`var(--yellow)`, `var(--dark-black)`) สำหรับ theme colors
- CSS classes ใน `custom.css` (`fs-12`, `figure-large`) สำหรับ responsive font/size utilities

### Icon pattern:
```tsx
// 1. import ที่ component ที่ใช้
import { TbVideo, TbCar } from "react-icons/tb"

// 2. เพิ่มเข้า ICON_LIST map
const ICON_LIST: Record<string, React.ComponentType> = {
  TbVideo, TbCar,
}

// 3. ใช้ผ่าน menu config (string name)
{ icon: "TbVideo" }  // menu config
// → Icon component lookup at runtime
```

---

## 15. หน้าที่ยังไม่เสร็จ / Placeholder

ดูรายการเต็มในเอกสารเวอร์ชันก่อนหน้า

---

## 16. Quick Reference — ถ้าจะเพิ่ม feature ใหม่

### เพิ่มหน้าใหม่ใน sidebar (admin role):

1. สร้าง feature folder: `src/features/admin/<feature-name>/screen/index.tsx`
2. สร้าง page shell: `src/app/admin/<feature-name>/page.tsx` → import screen
3. เพิ่ม menu item ใน `src/configs/menu/admin.ts`:
   ```ts
   { key: '15', title: 'New Page', label: 'NewPage', icon: 'TbIconName',
     path: '/admin/newpage', path_active: '/admin/newpage', path_list: [] }
   ```
4. เพิ่ม icon ใน `ICON_LIST` ทั้ง `Navbar.tsx` และ `SidebarContent.tsx`:
   ```tsx
   import { TbIconName } from "react-icons/tb"
   // เพิ่มใน ICON_LIST: TbIconName
   ```

### เพิ่ม Redux state:

1. สร้าง type ใน `src/types/`
2. สร้าง slice ใน `src/stores/reducers/<name>/<name>Slice.ts`
3. Register ใน `src/stores/reducers/index.ts`
4. สร้าง service ใน `src/services/routes/<Name>Service.ts`
5. สร้าง async thunk ใน slice
6. ใช้ `useAppDispatch()` + `useAppSelector()` ใน component

### เพิ่ม shared component:

1. สร้างใน `src/components/<category>/`
2. Export from index.ts (ถ้ามีหลายไฟล์ใน category)
3. เพิ่ม Storybook story (`.stories.tsx`) ถ้าเป็น component ที่ซับซ้อน

---

*สร้างเมื่อ: 14 พฤษภาคม 2569*
*อัปเดต: เวอร์ชันละเอียด*
