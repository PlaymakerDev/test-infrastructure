# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 ITS (Intelligent Transportation System) dashboard for Thailand's Department of Rural Roads (กรมทางหลวงชนบท). It features CCTV management, vehicle tracking, VMS (Variable Message Signs), bridge lighting control, and traffic monitoring with live maps and video streaming.

## Branch flow — MUST follow (2026-07-18)

**Do NOT push directly to `production`.** Team convention:

1. New commits land on **`temp`** first (`git push origin temp`). Integration / manual smoke happens there.
2. To ship, run **`bash /home/kaiser/promote-temp-to-prod.sh`** on `10.10.0.106` as user `kaiser` — fast-forwards `production` to `temp`, pushes `production`, then delegates to `auto-pull-build-its-new.sh` for the build + service restart.
3. `production` history is always a subset of `temp` — no divergent branches, no directly-pushed commits.

If someone accidentally commits straight to `production`, the promote script refuses to run and prints the offending commits. To resolve: merge `production` back into `temp`, push `temp`, then re-run promote.

Locally: default working branch is `temp`. Only switch to `production` for the promote step (or let the script do it for you on the deploy host).

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run unit tests (vitest, node environment)
npm run storybook    # Storybook component explorer on port 6006
```

Unit tests live at `src/**/*.test.ts`. Run `npm run test` (vitest `unit` project — Node, no browser). Storybook interaction tests use `npm run storybook` → addon-vitest panel (browser project). There is no `typecheck` script — run `npx tsc --noEmit` manually to type-check.

## Architecture

### Page → Screen → Component pattern

Pages (`src/app/`) are thin wrappers that import and render a Screen component:

```
src/app/admin/dashboard/page.tsx
  → src/features/admin/dashboard/screen/index.tsx   (logic + layout)
    → src/features/admin/dashboard/components/       (UI pieces)
```

All business logic lives in `screen/index.tsx` or a `context/` directory alongside it. Pages never contain logic.

Screen files must always be named `screen/index.tsx`. Do NOT use `ScreenOverallXxx.tsx` or similar (inconsistency exists in traffic-signal — do not replicate it).

### Directory Map

```
src/
├── app/             # Next.js App Router — pages and API routes only
├── features/        # Feature modules (admin, auth, example)
│   └── admin/<feature>/{overall,detail}/{screen,components,context,data}
├── components/      # Shared UI primitives (chart, layout, map, video, list)
├── stores/          # Redux store, slices, typed hooks
├── services/        # API layer (BaseService, ApiService, route services)
├── configs/         # Ant Design theme, menu config
├── constants/       # App-wide constants (vehicle types, status codes, labels)
├── types/           # Shared TypeScript types
├── utils/           # Utility functions and custom hooks
├── lib/             # iron-session config + Antd static helpers
├── mock/            # Mock JSON data for development (display-schedule, menu, route-schedule, test, controlcam)
└── styles/          # Global CSS
```

### API Layer

All HTTP calls go through `src/services/BaseService.ts` (Axios instance), which:
- Fetches `access_token` from `/api/auth/session`, cached ~5s via a promise-cache that dedupes concurrent requests (do not add inline `fetch()` calls in components)
- Injects `Authorization: Bearer <token>` and `x-api-key` on every request
- On `40199` (expired) or a bare HTTP `401`: silently refreshes the token (single-flight — concurrent failures share one refresh) and retries the original request; logs out if the refresh itself fails
- On `40100` (invalid token): shows one guarded error modal then logs out (with a null-modal fallback that logs out directly, so requests never hang)

`src/services/ApiService.ts` wraps BaseService with a generic Promise interface. Feature-specific services live in `src/services/routes/` (e.g., `AdminService.ts`).

Backend base URL is set via `NEXT_PUBLIC_HOST_BACKEND` in `.env`.

### Authentication

- Middleware: `src/proxy.ts` (exports `proxy` function — not the default `middleware.ts` filename)
- Server-side session: iron-session configured in `src/lib/defaultSession.ts` — cookie name `DRR_ITS`, maxAge 30 days
- API routes: `src/app/api/auth/[...all]/route.ts` handles login, logout, and token refresh
- Server-side session helper: `src/utils/hooks/useGetSession.ts` (uses `cookies()` — server-side only)
- Token expiry modal: `src/utils/hooks/useTimeoutModal.ts` — exports `getGlobalModal()` / `setGlobalModal()` used by BaseService
- Role: currently hardcoded `"ADMIN"` at login — `src/utils/allowAdmin.ts` is an **empty file** (RBAC not yet implemented)

### State Management

Redux Toolkit via `src/stores/`. Always use the typed helpers:
- `useAppDispatch`, `useAppSelector`, `useAppStore` from `src/stores/hooks.ts`

**Active slices (have real consumers):**
- `layout` — `drawer.open` (sidebar toggle) and `task_schedules.loading`; dispatched from Navbar and login screen

**Placeholder/scaffolding slices (not yet wired to real data):**
- `admin` — `getAdminData` thunk defined but never dispatched
- `auth` — no consumers
- `example` — demo only

Do NOT add server-fetched data to Redux slices. When connecting to the real backend, use `RtkQueryService.ts` (after fixing the `await` bug — see Pitfalls) or TanStack Query.

**Context:** Most feature contexts are empty boilerplate (`value={{}}`). Only these have real state:
- `control-vms/overall` — bureau / sign / route / isAddMode / searchText / searchDate
- `statistics/overall` — currentTab / activePeriod
- `statistics/detail/alert|incident|status` — detail view state
- `tracking/detail/gps` and `tracking/detail/license` — search/compare state
- `bridge-lighting/detail` — detail state
- `traffic-signal/detail` — detail state

Do not create new Context providers with empty `value={{}}` — they add overhead without value.

### Import Alias

`@/*` maps to `src/*`. Always use `@/` imports, never relative paths crossing feature boundaries.

## UI Conventions

- **Component library**: Ant Design 6 with a custom dark theme — primary color `#FCD116` (yellow). Theme config is in `src/configs/antd/themeConfig.ts`.
- **Styling**: Tailwind CSS 4. Prefer Tailwind utility classes; use `src/styles/` for global overrides only.
- **Font**: IBM Plex Sans Thai (loaded globally).
- **Charts**: ECharts via `src/components/chart/` wrappers. Use existing wrappers before reaching for ECharts directly. Do NOT use Recharts (installed but unused — see Pitfalls).
- **Maps**: Mapbox GL via `src/components/map/`.
- **Video**: HLS live streams via `src/components/video/`.
- **Animation**: Use `motion` package only. Do NOT use `framer-motion` (both installed but `motion` is the current one).

### Theme colors — never invent (rule set 2026-07-19)

Every colour in the admin UI **must** come from an authoritative source that already exists in the project. Never pick an ad-hoc hex or a stock AntD colour name (`processing`, `cyan`, `geekblue`, `gold`, `volcano`, `green`) unless you can point to a sibling module that already uses that exact token for the same UI element.

**Order of lookup:**
1. **`src/styles/globals.css` tokens first** — the canonical palette:
   - `--yellow` (`#FCD116`) — primary / brand
   - `--default-blue` (`#66AEFF`) — secondary text, accent pills
   - `--red` (`#FF6666`) — danger, offline
   - `--light-blue` (`#05F2DB99`) — teal accent
   - `--dark-black` (`#191919`) — panel bg
   - `--light-black` (`#212121`) — nested panel bg
   - `--mid-gray` (`#2B2B2B`) — hover row bg
   - `--light-gray*` — subdued text
2. **If globals.css doesn't have it, mirror an existing solution module.** Grep sibling admin features (cctv, traffic-signal, crosswalk, incident-detection, settings, bridge-lighting, traffic-volume, tracking) for the same UI element (Tag, Chip, Badge, StatusPill, Popconfirm palette) and copy the approach — including any `ConfigProvider theme.components.*` block. Do not invent a new scheme.
3. **For `light-modal` popups** — reuse the existing `body .light-modal .<selector>` overrides in `src/styles/antd.css`; do not roll new ConfigProvider hex tokens per-component.
4. **If uncertain, ASK — don't guess.**

Use Tailwind 4's `text-(--yellow)` / `bg-(--dark-black)` / `border-(--default-blue)` bracket syntax against the CSS custom properties above — this is the style already used everywhere in the app.

Applies to every admin surface. Introduced after repeated iterations on the VMS Command Center picked off-palette AntD tag colours that clashed with the yellow-on-black brand look.

## Data Fetching

Backend integration has expanded well beyond `control-vms/overall` (surveyed 2026-07-04) — most admin features now call the real backend. **Four data-fetching patterns coexist**; know which one a feature already uses before touching it:

1. **Feature-colocated hooks + query-key factory** — `features/admin/<feature>/overall/hooks/` + `overall/data/queryKeys.ts`. Used by **`control-vms/overall`** (19 hooks — full canonical write-up below) and, as of 2026-07-09, **`tracking/detail/wim`** (15 hooks in `detail/wim/hooks/`, factory in `detail/wim/data/queryKeys.ts` — see "tracking/detail/wim" below). `detail/wim` deliberately chose this pattern over pattern 2 specifically to mirror control-vms's own structure (the explicit ask was "bring this feature to control-vms parity") — pattern 2 remains the right default for unrelated new work.
2. **Shared top-level hooks + query-key factory** — `src/hooks/queries/<feature>/{queryKeys.ts, use*.ts}`. This is the more common pattern for everything wired up after control-vms. Used by **`cctv`**, **`incident-detection`**, **`traffic-signal`**, **`crosswalk`**, **`traffic-volume`**, **`dashboard`**, and (added since the 2026-07-04 survey) **`tunnel`**, **`lpr`**, **`lighting`** (backs traffic-lighting + statistics' top-power-roads card), and **`manage`** (26 hooks — admin CRUD for users/projects/roads/contractors, notifications summary, departments). Hook counts drift; `ls src/hooks/queries/<feature>/` is ground truth. `src/hooks/queries/shared/` holds cross-feature helpers. **Default to this pattern for new features** (unless mirroring control-vms specifically, per pattern 1 above).
3. **Inline `useQuery` directly inside a component** — no extracted hook, no key factory, key written by hand at each call site. Used by `tracking/overall` and three of the four `tracking/detail/*` sub-features (`gps`, `license`, `mobile` — via `TrackingService.ts`/`TrackingDetailService.ts`; `detail/wim` was migrated off this pattern 2026-07-09, see below), `vms/overall` (`VMSService.ts`, distinct from `ControlVMSService.ts`), and `statistics/detail/status` (hand-written `['vms_notifications']`/`['contact_detail']`/`['vms_status']`/`['vms_details']` keys). Works, but don't replicate for new work — extract a hook per pattern 1 or 2 instead.
4. **Raw `useEffect` + local `useState`, bypassing TanStack Query entirely** — the pre-TanStack legacy pattern. Used by **`maintenance/*`** (`MaintenanceService.ts` — still 100% this pattern as of 2026-07-19, zero TanStack usage in the whole feature), parts of **`traffic-lighting`** (see the hybrid note below), and **`statistics/detail/alert`** (`AlertDetailTable.tsx` raw-fetches `getLightingAlertsAPI` despite `useLightingAlerts` existing). Do NOT replicate; migrate to pattern 2 if you're already in one of these files for other reasons.

**Three-menu audit (2026-07-19)** — `maintenance`, `statistics`, `traffic-lighting` were audited against the six clean pattern-2 features (cctv, crosswalk, traffic-signal, traffic-volume, incident-detection, tunnel — verified same-day: all six use factory hooks with zero `useEffect` fetching; their only deviations are 5 inline-`useQuery` modal call sites sharing a hand-written `['department_by_road', roadId]` key across 3 features + an inline `['cctv_detail']` in `CctvMarkerInfoPanel.tsx`, and 2 leftover empty `value={{}}` contexts in `incident-detection`). Current per-menu state:
- **`maintenance`** — pure pattern 4 everywhere (5 fetching files: case/screen, detail/screen, `MaintenanceOverviewSection`, `RepairRecordsSection`, repair-history/screen). `maintenance/overall/context/index.tsx` is an empty `value={{}}` provider — delete it when in that area. No hooks dir, no factory, no Zod schema.
- **`traffic-lighting`** — hybrid: `src/hooks/queries/lighting/` (pattern 2: `useLightingOverview`, `useTopPowerRoads`, `useLightingDiagram`, `useLightingAlerts`, `useAllLightingAlerts`) is real and used by 8 files, BUT both contexts (`overall/context` — centralList/centralTotals/randomOnline; `detail/context` — deviceDetails) and `SummaryReportSection.tsx`/`VoltageAmpChartsRow.tsx` still raw-fetch via `useEffect`. The lamp detail page's equipment table + stat cards are still pure mock (`detail/lamp/data/`).
- **`statistics`** — three patterns in one menu: overall tab is proper pattern 2 (hooks from `incident-detection`/`manage`/`lighting` + feature-colocated composite hooks in `statistics/data/useLive*RouteItems.ts`); `detail/status` is pattern 3; `detail/alert` is pattern 4. No longer mock — the old "statistics is pure mock" note below is obsolete.

Still pure mock/static (hardcoded in `data/*.ts` or inline): `statistics`, `smart-search`, and any feature not named above. `GET /auth/me` (`AdminService.ts`) is the only non-feature backend call. `bridge-lighting` was migrated off mock 2026-07-18 — see the "bridge-lighting" bullet under "Other backend-integrated features" below.

**Zod response validation exists for `control-vms`, `shared`, `crosswalk`, `tracking`, `lpr`, and `tunnel`** (`src/schemas/`, verified 2026-07-19) — the `tracking` schema covers only the endpoints `detail/wim/hooks/` consumes, not the whole feature. Every other feature in pattern 2–4 above (including all three audited menus: cctv, traffic-signal, traffic-volume, incident-detection, maintenance, lighting, statistics' domains) fetches typed-but-unvalidated responses — a real, largely-un-tracked gap, not a deliberate omission.

Canonical pattern when connecting a feature to the real backend:
1. Add a typed service function to `src/services/routes/<Feature>Service.ts` using `ApiService.fetchData<ResponseType>()`
2. Fetch via **TanStack Query** — put the hook in `src/hooks/queries/<feature>/` with a query-key factory (pattern 2) unless the feature already has feature-colocated hooks (pattern 1 — control-vms, tracking/detail/wim), or you're deliberately mirroring one of those two. `useQuery`/`useInfiniteQuery` for reads, `useMutation` for writes. Do NOT fetch in `screen/index.tsx`, do NOT call a service function inside a component's `useEffect`, and do NOT mirror server data into Redux.
3. Define the API response type in `src/types/<feature>/`
4. Add a Zod schema in `src/schemas/<feature>.ts` — every feature besides control-vms, shared, crosswalk, lpr, tunnel, and (partially) tracking is missing this; don't compound the gap in new work if you can avoid it.

`ApiService.fetchData<T>()` returns `Promise<AxiosResponse<T>>`, so TanStack's `data` is the AxiosResponse — unwrap the payload with `.data`.

### Other backend-integrated features (surveyed 2026-07-04)

None of these have control-vms's audit-level documentation — treat the source as ground truth, this is an orientation map only.
- **`cctv`**, **`incident-detection`**, **`traffic-signal`** — camera lists/totals/dropdowns, central-list variants, overview, uptime/peak-hour/daily stats, contract/phase details, reports. Standard pattern-2 shape, nothing unusual found.
- **`crosswalk`** — its formerly-empty `overall/context` provider has been deleted (verified gone 2026-07-19). The same empty-`value={{}}` smell now lives in **`incident-detection`** instead: both `incident-detection/overall/context/index.tsx` and `incident-detection/detail/context/index.tsx` — delete rather than "fix" if you're in those files.
- **`traffic-volume`** (15 hooks as of 2026-07-04) — `detail/components/section/reportvolume/` (daily/hourly/monthly/yearly/vehicle-type tables + `HourlyMatrixTable.tsx`) is backend-integrated via `useTrafficVolumeReportSummaryInfinite`; a stale comment at `reportvolume/index.tsx:300-302` still claims month/year/vehicle-type use mocks — they don't, delete the comment if you touch that file. `CamerasGridTrafficVolume.tsx`/`TableCameraTrafficVolume.tsx` were migrated from a batched `useQueries` N+1 per-camera IP lookup (`getCCTVDetailAPI` called once per camera) to a single richer `useTrafficVolumeSolutionCamerasList` hook hitting `/cameras/list`, which returns `ip_address`/`status.is_online` inline — prefer this over adding a new per-item follow-up fetch if a future endpoint already carries the field you need.
- **`tracking`** (surveyed 2026-07-09) — `overall/` and three of the four `detail/*` sub-features (`gps`, `license`, `mobile`) are backend-integrated via pattern 3, with zero extracted hooks and no query-key factory (unchanged, deferred to a future rollout — see "tracking/detail/wim" below for the applicable template). **`detail/wim` was migrated to pattern 1 the same day** — see the full write-up below.

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Directories | `kebab-case` | `bridge-lighting/`, `control-vms/` |
| Component files | `PascalCase.tsx` | `TitleSection.tsx` |
| Screen files | `screen/index.tsx` | always this path, no exceptions |
| Hook files | `camelCase.ts` | `useGetSession.ts` |
| Slice files | `camelCase` + `Slice` suffix | `adminSlice.ts` |

**Known typos already in the codebase — do NOT replicate, do NOT rename (would break imports):**
- `src/features/admin/cctv/serchcctv/` — typo of "search"; used by `app/admin/cctv/search/page.tsx`
- `src/components/sideabar/` — typo of "sidebar"; canonical sidebar is `src/components/layout/sidebar/`
- `src/components/chart/ฺBarChart.stories.tsx` — leading Thai character U+0E3A in filename

When creating a component that sounds like it might already exist (TitleSection, MapSection, InfoCardSection, etc.) — **search first**. These names appear 7–22 times across features.

**Three similarly-named but unrelated features — do not confuse:**
- `bridge-lighting/` — decorative lighting fixtures mounted on bridges (ไฟประดับสะพาน). Detail-side backend-integrated via `BridgeLightingService.ts` (on/off toggle, PM chart, shelly status, WID resolver) since 2026-06-something; **live Shelly telemetry dual-writes to the new PG's `bridge_lighting.tbl_shelly_state` as of 2026-07-18** — see the "bridge-lighting" bullet under RESOLVED sections. Settings-side create is via `POST /manage/solution` type=10 with a nested `bridge_lighting: {wid}` block.
- `traffic-lighting/` — traffic-light-pole/signal-cabinet electrical monitoring (voltage/amp, lamp equipment). Backend-integrated via `LightingService.ts` (raw `useEffect` pattern — see Data Fetching). Settings-side create is via `POST /manage/solution` type=6 with a nested `lighting: {lighting_type, imei, phase_type, sem_type, diagram_type, connection_type, send_frequency}` block.
- `traffic-signal/` — traffic signal timing/phase control. Backend-integrated via `TrafficSignalService.ts` (`src/hooks/queries/traffic-signal/` hooks — see Data Fetching). Settings-side camera attach is via `TrafficSignalCameraModal` — per-row `{camera_id, phase, camera_type}` where `camera_type ∈ 'Counting' | 'StopLine'` (case-sensitive).

## Known Tech Debt & Pitfalls

These are **confirmed issues** from a full architecture review (2026-06-05). Avoid making them worse.

### Do NOT copy-paste feature section components
Shared primitives now exist in `src/components/section/` — use them instead of creating new per-feature copies:
- **`TitleSection`** (`components/section/TitleSection.tsx`) — accepts `title`, `subtitle`, optional `tabOptions`/`defaultTab`/`onTabChange`, `className`. 8 simple/tab feature copies migrated to thin wrappers; 14 detail-page variants (with back-button + feature-specific device data) remain as-is.
- **`StatCardRow` + `StatCard`** (`components/section/StatCard.tsx`) — accepts a `cards` array of `{icon, title, count, unit, activeLabel, color}`. Replaces the yellow/teal/gray 3-card layout used by bridge-lighting, crosswalk, incident-detection (3/7 InfoCardSection copies migrated). Remaining 4 have structurally different layouts.
- **`FeatureSectionLayout`** (`components/section/FeatureSectionLayout.tsx`) — accepts `top`, optional `middle`, optional `bottom` ReactNode props; renders 2 or 3 stacked sections. 13/18 OverallSection copies migrated. Remaining 5 have feature-specific logic (collapsible panels, Redux/context hooks, absolute-positioned overlays, multi-column grids) that cannot be safely abstracted.
- **`DetailTitleSection`** (`components/section/DetailTitleSection.tsx`) — the device-**detail** header (back arrow + "<feature> : สายทาง <road>", install point + ⓘ Project-Info icon, warranty pill, Google Map button, optional AnyDesk button, optional online/offline pill, optional SwapButton tab row). Modelled on the CCTV detail header; every action/badge is opt-in via props. Consumed by the `detail/components/TitleSection.tsx` of **cctv, traffic-volume, traffic-signal, crosswalk, incident-detection, bridge-lighting** (2026-07-14) — each of those files now just resolves its own data/handlers and renders `<DetailTitleSection>`. This is distinct from the simpler `TitleSection` above (title + subtitle + tabs, no device chrome). Other detail headers (vms, tracking/detail/wim, traffic-lighting) still have bespoke headers — migrate them to this when next in the file.

`MapSection` (10 copies) and `DataDisplaySection` (8 copies) are too feature-divergent to extract — leave as-is.

### Unused / duplicate dependencies
- **`recharts`** — installed but used 0 times. Use ECharts wrappers in `src/components/chart/` instead.
- **`motion` + `framer-motion`** — both installed (same engine). Use `motion` only.
- **`better-auth`** — installed but not configured as auth layer. Do not `import` from it for new code.

### Placeholder files (not yet implemented)
- `src/app/page.tsx` — still the create-next-app default template. Redirect is handled in `next.config.ts`.

### VMS detail status flags travel via URL query params (observed 2026-07-04)
`vms/detail/screen/index.tsx` reads `is_warranty`/`is_online` via `useSearchParams()` instead of fetching them from the detail API itself. Direct navigation to the detail route without those params silently defaults to "expired warranty / offline". Always pass both params explicitly when linking to this route from new code; don't assume the detail page is self-sufficient.

### Known bugs / tech debt
- **`src/services/RtkQueryService.ts:19`** — `axiosBaseQuery` was missing `await` on `BaseService(request)` (fixed 2026-06-24). RTK Query is still not wired to the store — TanStack Query is used for server state instead.
- **`tracking/detail/wim/components/sections/overall/ChartPreviousWeightVehicle.tsx`** — the day-tab handler compared the emitted period value against the literal `'วัน'`, but the actual tab label is `'วันนี้'`, so picking the day tab silently matched no branch and fell through to `setDateType('year')` (fixed 2026-07-09 — replaced with a `PERIOD_DATE_TYPE` lookup keyed on the exact tab labels). Watch for this class of bug generally: a callback's parameter type annotation (`(period: 'วัน' | 'เดือน' | 'ปี')`) is not proof the runtime value actually matches — it only reflects what the author assumed at the call site.
- **`src/components/layout/Navbar.tsx`** — calls `useSearchParams()` directly (added in commit `753912c`, to reset map-focus mode on query changes) with no local Suspense boundary. `Navbar` is mounted unconditionally by `src/components/layout/Layout.tsx`, which every `/admin/*` route renders via the client `src/app/admin/layout.tsx` — this broke `next build`'s static export for **every** admin page (`useSearchParams() should be wrapped in a suspense boundary`), and Next aborts the whole build on the first page it fails to prerender. The existing per-page Suspense convention (wrap the page's own screen in `<Suspense>` — see `src/app/admin/maintenance/page.tsx`) does **not** cover this: `Navbar` sits outside `{children}`, so a page wrapping its own content in Suspense never reaches it. Fixed 2026-07-13 by wrapping `<Navbar />` itself in `<Suspense fallback={null}>` inside `Layout.tsx`. **Rule going forward:** any hook that needs a Suspense boundary (`useSearchParams`, `use()`, etc.) added to shared chrome rendered by `Layout.tsx` (Navbar, Sidebar) must be wrapped locally there — per-page Suspense wrapping is not sufficient. `src/components/layout/sidebar/SidebarContent.tsx` also calls `useSearchParams()` unguarded but does not currently break the build, because it only mounts inside an antd `Drawer` that lazy-mounts children on first open (`forceRender` defaults to `false`) — re-check this if the Drawer's mount behavior ever changes.

### Accepted Security Risks — documented 2026-06-24

These risks are **explicitly accepted** for the current deployment context (internal government dashboard, no public internet exposure). Each entry states the risk, current mitigations, and the fix trigger.

#### RISK-01 — Client-accessible bearer token (Medium)

**Risk:** `GET /api/auth/session` returns `access_token` as JSON so `BaseService.ts` can inject it as `Authorization: Bearer`. A successful XSS attack could exfiltrate the token and impersonate the user until it expires.

**Current mitigations:**
- Session cookie is `HttpOnly` + `SameSite=Strict` (iron-session) — XSS cannot steal the session itself
- `refresh_token` is never exposed to client JS
- Token auto-rotates on `40199` expiry
- RBAC enforced at the edge (`proxy.ts`) — stolen token grants no privilege escalation beyond what the user already has
- `TOKEN_SECRET` is production-safe (throws if not set)

**Fix path:** Move all backend API calls to Next.js route handlers (`app/api/…`). `BaseService.ts` becomes a thin server-side fetch helper that reads the session cookie directly via `getIronSession`, never passing the token to the browser. This is a full architectural refactor (~2–4 sprint weeks).

**Trigger:** Before public internet exposure, or if a Content Security Policy audit surfaces a viable XSS vector.

#### RISK-02 — API key in browser bundle (Low)

**Risk:** `NEXT_PUBLIC_API_KEY` is injected into the client bundle and visible in DevTools. An attacker who knows the key can call the backend directly.

**Current mitigations:** Backend also requires a valid `Authorization: Bearer` token (which requires a session). The API key alone is insufficient for authenticated API calls.

**Fix path:** Same as RISK-01 — proxying all backend calls server-side makes the key server-only. Can also rotate the key on a schedule as a short-term mitigation.

**Trigger:** Before public internet exposure.

> **BaseService was hardened (~2026-06-22, committed)** — `src/services/BaseService.ts` now has a 5s session promise-cache, single-flight refresh lock, silent auto-refresh on `40199`/bare-401, and a `40100` guarded error modal with null-modal→logout fallback.

> **`test/BaseService.ts` is excluded from tsconfig** (2026-06-24) — it imports nonexistent `AuthService` and uninstalled `sweetalert2`. Do not add new test files to `test/`; use Storybook/Vitest instead.

### Route boundaries — added 2026-06-24
`src/app/admin/error.tsx`, `loading.tsx`, and `not-found.tsx` now exist (Ant Design Result/Spin). Add feature-level boundaries (e.g. `src/app/admin/cctv/error.tsx`) when implementing a feature properly.

### Dead code — cleaned 2026-06-24
- `src/features/admin/control-vms/detail/` — deleted (UI prototype, no route, no API calls)
- `src/features/manager/` and `src/features/user/` — empty placeholder dirs deleted
- `src/stores/reducers/admin/adminSlice.ts` and `authSlice.ts` — deleted (never dispatched; auth slice also stored `refresh_token` in client-side Redux state)
- `test/BaseService.ts` — excluded from tsconfig (unresolvable imports)

### RBAC and session security — resolved 2026-06-24
- `src/utils/allowAdmin.ts` — implemented (reads iron-session role)
- `src/proxy.ts` — gates `/admin/*` routes by `session.role === 'ADMIN'`
- `src/lib/defaultSession.ts` — `TOKEN_SECRET` now throws in production if not set; dev warns with a safe dev-only fallback (no hardcoded secret in source)

### control-vms — Command Center overhaul (2026-07-19/20)

`/admin/control-vms` is now a **3-tab Command Center**: `?tab=dispatch` (scope picker + composer + real-time monitor with countdown & progress bar) · `?tab=history` (cross-sign timeline table with date pills) · `?tab=media` (first-class media library with categories CRUD + upload + drag-drop preview). `/admin/vms-command-center` is a permanent redirect for old bookmarks. All new code lives under `src/features/admin/vms-command-center/`.

**New backend contract** (bundled in `Klanarm/drr_its_service`, applied on 10.10.0.112 via migrations `2026-07-19_vms_setting_status_history.sql` + `2026-07-19b_vms_media_library.sql`):
- **`vms.tbl_vms_setting_status_log`** — append-only status history via trigger `vms.fn_log_vms_setting_status()`. Writes only on `NEW.status IS DISTINCT FROM OLD.status`. Every writer opens a tx and `SET LOCAL app.vms_status_source = '<label>'` (+ `app.vms_status_changed_by` when applicable) — trigger reads via `current_setting()`. Labels: `device / admin_override / admin_cancel / admin_edit / watcher_disconnect / watcher_expired / worker_advance / seed`. **Rule going forward:** any new writer of `tbl_vms_setting.status` must set the GUC or it lands as `source='unknown'`.
- **`vms.tbl_vms_media`** — first-class media library (id, url, name, filename, mime_type, setting_type_id nullable, uploaded_by, uploaded_at, deleted_at, unique-on-active-url). Replaces the earlier "URLs are implicit inside past schedules" model.
- **13 new endpoints under `/api-v2/vms/`**: `command-center/{monitor,history,sign/:vms_id}`, `settings/media/:id/{cancel,history}`, `crossings/:cmi/history`, `media/*` (CRUD + category-counts + bulk-delete). See project_vms_command_center memory (out-of-tree) or grep `internal/api/router/vms_setting.go` for the wiring.
- **`command_no`** — running 1..N per-sign command index exposed on every monitor/history/setting-history response. Human-friendly label for the shared `setting.id`. Not sent to devices; device POSTs still key on setting_id.

**Frontend conventions** for anything under vms-command-center or touching the VMS surface:
- **Every image/video preview** = `aspectRatio: '16/9'` + `background: '#000'` + `objectFit: 'contain'`. Grid cards, upload previews, edit modals, LiveMonitor thumbnails, SignDetailModal HLS players. Letterboxes portrait/4:3 sources cleanly.
- **Status enum + colours** — `src/features/admin/vms-command-center/constants/vmsStatus.ts` (0..7 with `isActive`, `isTerminal`, `isCancellable`). Consume via `statusMeta(status)` + `<StatusPill>`. Do NOT redefine.
- **Modals**: light forms use `wrapClassName='light-modal'` + `<ConfigProvider theme={{ components: { Modal, Input, Select } }}>` white overrides + `classNames={{ popup: { root: 'light-modal-popup' } }}` on every Select/DatePicker (Select popups portal outside modal DOM so `.light-modal` doesn't reach them). Dark viewer modals mirror `components/modal/CCTVModal.tsx` (border-2 border-(--default-blue), colorIcon white). App root `themeConfig.ts` now has a `Popover` component override so Popconfirm/Tooltip render on dark bg globally — don't wrap individually.
- **BureauList** accepts `alwaysSelectMode` (checkboxes stay visible; ยกเลิกทั้งหมด clears ticks instead of exiting select mode) + `includeOfflineOnSelectAll` (default false — "เลือกทั้งหมด" filters online-only; offline signs stay individually tickable).
- **LiveMonitor** shows live countdown / progress bar / summary counts, dims terminal cards to 0.65 opacity (they stay visible for audit), has a `ซ่อนที่เสร็จแล้ว` toggle. Multi-day schedules resolve to today's `[time_since..time_to]` window when today's ISO weekday matches `days_of_week` mask.

### control-vms/overall — reference implementation (fully refactored 2026-06-23)
The first backend-integrated feature. Canonical template for all future backend work. Key patterns:

**Data fetching**
- **Query key factory** at `features/admin/control-vms/overall/data/queryKeys.ts` (`controlVmsKeys`) — use this pattern for every new backend-integrated feature.
- **Co-located hooks** at `features/admin/control-vms/overall/hooks/` — 12 hooks. Reads: `useVMSSettingTypes`, `useVMSDepartments`, `useVMSMediaList` (`useInfiniteQuery`), `useContactDetail`, `useUpcomingSummary`, `useVMSSettingByRoad`, `useVMSSchedule`, `useVMSSettingListInfinite` (`useInfiniteQuery`, drives the จุดติดตั้ง picker), `useVMSMediaById` (wraps `getVMSMediaByIDAPI`, enabled-guarded, uses `controlVmsKeys.mediaDetail(id)`). Writes: `usePostVMSMedia`, `usePutVMSMedia`, `useDeleteVMSMedia`. `useVMSSettingList` was deleted (0 consumers — use `useVMSSettingListInfinite`). Components are purely declarative; all query/mutation logic lives in hooks.
- **Shared invalidation helper** `hooks/invalidateVmsMediaWrites.ts` — invalidates `media()`, `upcomingSummary()`, `settingByRoad()`, `schedule()`, `settingList()` prefix keys in one call. All 3 write hooks use this helper. `useDeleteVMSMedia` additionally calls `removeQueries({ queryKey: mediaDetail(id) })` before invalidation.
- **No server data in Redux** — the former `control_vms` Redux slice was deleted. Setting types are shared via the TanStack Query cache.

**Writes**
- **`useMutation` for writes** — submit button binds `loading={isPending} disabled={isPending}` to prevent double-submit.
- **`mutate(body, { onSuccess })` pattern** — do NOT use `mutateAsync` (unhandled rejection risk); use `mutate` with callback so form closes only on success and stays open (retryable) on error.
- **File upload via `FormData`** — `postUploadVMSAPI(form: FormData)` with no manual `Content-Type` header; axios sets the boundary automatically. Use `AxiosError` (not `Error`) for upload catch to surface `error.response?.data?.message`.

**State & modals**
- **Modal state is local** — components own `useState<Data | null>` and pass `open={data !== null}`, `onClose={() => setData(null)}` as props; no modal state in Context.
- **Context inits to `null`** — bureau/bureauState/bureauRoute/bureauSign start as `null`; VMSSection gates rendering on `bureauSign !== null`.
- **Context also holds filter state** — `searchText: APIRequestVMSSettingByRoad | null` and `searchDate: APIRequestVMSSettingSchedule | null` consumed by the DISPLAY tab (`DataDisplaySection`, `ScheduleDisplaySection`).
- **Bureau type aliases** live in `src/types/control-vms/bureau.ts`; re-exported from `components/list/BureauList.tsx` for backward compat.

**Media display**
- **Video vs image detection** — use `isVideoUrl(url)` from `overall/data/media.ts` (single source of truth for `VIDEO_EXTENSIONS`). Do NOT re-declare the regex in components.
- **`VMSMedia` component** — `components/sections/vms/VMSMedia.tsx` owns the branch: `variant='thumbnail'` → `<video preload="metadata" muted>` with `#t=0.1` fragment for a static first-frame poster (no autoplay, no decode loop); `variant='player'` → `<video controls autoPlay>` for full playback. Both fall back to antd `<Image>` for non-video URLs.
- **`HLSLivePlayer` is for live HLS CCTV only** — do NOT use it for stored VOD files (.mp4/.avi/.mov). It has no `controls` attribute, calls `play()` unmuted (blocked by browser autoplay policy), and runs reconnect/capture timers indefinitely.
- **Grid card branching** — `ContentSetting` branches by `isVideoUrl`: video → `<figure onClick={onCardClick}><VMSMedia variant='thumbnail'></figure>` (click → `ModalMediaPreview`); image → `<figure><Image></figure>` with no `preview={false}` so antd's built-in lightbox handles the click natively. Do NOT put `onClick` on the image figure.
- **Media preview modal** — `ModalMediaPreview` accepts `open`, `data: VMSMediaList | null`, `onClose`; uses `VMSMedia variant='player'` + `destroyOnHidden` to stop playback on close. Used for **video only** — images use antd Image's own preview.

**Null safety**
- Nested array guards: `(arr ?? []).reduce(...)` / `(arr ?? []).filter(...)` for any backend-sourced tree (mirrors how `BureauList` guards its render).

**DISPLAY section — standardized (resolved 2026-06-24):** `DisplayStatCard`, `DataDisplaySection`, and `ScheduleDisplaySection` now use co-located hooks (`useUpcomingSummary`, `useVMSSettingByRoad`, `useVMSSchedule`) backed by `controlVmsKeys` factory keys. `usePostVMSMedia` invalidation was expanded to cover `upcomingSummary()`, `settingByRoad()`, and `schedule()` prefix keys so the DISPLAY tab refreshes after any write. The `settingByRoad()/settingByRoadList(roadCode)` and `schedule()/scheduleList(month,year)` key pairs mirror the `media()/mediaList(id)` prefix-invalidation pattern.

**Schedule update/delete flow (DISPLAY tab)** — the ScheduleList row's edit/delete icons dispatch `setUpdateScheduleState({ open, id, type: 'EDIT'|'DELETE', vmsOption: item })` where `item` is the full `VMSSettingSchedule`. `ModalUpdateSchedule` reads the media record via `getVMSMediaByIDAPI(id)` and renders `FormUpdateSchedule` (CREATE/EDIT) or `ContentDeleteSchedule` (DELETE), passing `vmsOption` so the form can pre-seed the disabled จุดติดตั้ง Select label without waiting for the paginated list to load that page.

**`setting_id` IS accepted as the media `{id}`** (confirmed with backend 2026-06-25) — schedule rows expose `setting_id` (no separate media id); the backend aliases it so `GET/PUT/DELETE /vms/settings/media/{id}` work when called with `schedule.setting_id`. Do NOT "fix" this as an id-space mismatch. `GET /vms/settings/media/{id}` returns `{ date_since, date_to, is_all_day, solution_name, setting_type_name, department_short_name, date_count, status, status_updated_at, schedules: [{ id, days_of_week, media_url, message, schedule_name, time_since, time_to }], … }` (nested `schedules[]` array as of the 2026-07-02 v2 restructure below — top-level `since`/`to`/`media_url`/`message` no longer exist) — keep `APIResponseVMSMediaById` in sync with what the endpoint actually returns.

**Ant Design 6 `Select` — `filterOption` / `onSearch` are deprecated as flat props** — use the `showSearch` config object instead: `showSearch={{ filterOption: false, onSearch: handler }}` (type `SearchConfig`). For server-side search, pair with `onPopupScroll` for infinite scroll and a debounced `onSearch` (400ms via `useRef` timer, no external lib).

**Ant Design Calendar — `onSelect` fires before `onChange`** (`FormSearchCalendar`): when a date cell is clicked, `onSelect` fires first (before `onChange` commits the new value to React Hook Form). Always call `field.onChange(date)` inside `onSelect` before triggering the submit — do NOT rely on the Calendar's `onChange` prop having already updated the RHF field. Also: `dayjs().month()` is 0-indexed — add `+1` before sending to the backend.

**Media preview URL** — `postUploadVMSAPI` returns a full URL in `path`; store it directly as `file_url` and use as `previewSrc` without prepending the host. Backend `media_url` in GET responses is also a full URL. Do NOT prepend `NEXT_PUBLIC_HOST_BACKEND` to either.

**Ant Design `Radio.Group` + React Hook Form** — `field.onChange` for custom Ant Design components must receive the **value**, not the event object. Use `field.onChange(e.target.value)` (or the extracted `next` const), NOT `field.onChange(e)`. Passing the full `RadioChangeEvent` stores the event object as the field value, causing `useWatch` to return an object and `[object Object]` to appear in dependent inputs.

**Switching `display_type`** — on every Radio.Group `onChange`, clear all three: `setValue('text', ''); setValue('file_url', ''); setValue('file', [])`. This clears both the RHF state (`file_url`) and the Upload component's own fileList state (`file`). Without clearing `file`, the Upload preview remains visible in EDIT mode even after switching away.

**`SettingByRoad.setting_id`** — optional field `setting_id?: number` added to the interface. `DisplayTableData` uses it as `rowKey` when present, falling back to `solution_name-since-to` composite. Add `setting_id` if the backend `/vms/settings/by-road` endpoint returns it (avoids duplicate-key React warnings when the same VMS appears in multiple schedule slots).

**`VMSSettingByRoad`** now includes `region_name: string` (confirmed 2026-06-25).

**Unresolved data-contract questions** — verify with backend: does `GET /vms/settings/departments` return `Solution.vms_id`? (mock only has `solution_id`); and what `res_code` value means POST success?

**Audit complete (2026-06-25)** — the 54-agent correctness audit (17 issues, plan `mellow-tumbling-map.md`) is fully resolved. Build is clean (`npx tsc --noEmit` exits 0, 62 unit tests pass). All G1–G6 items addressed: API contract comments (H1), upload-in-flight guard (M1), badge dedup (M2), Radio.Group stale value (L2), `mediaDetail` key in factory + `useVMSMediaById` hook (L3), `invalidateVmsMediaWrites` helper (L4/L5), rowKey (L6), inner null guards (L7), road_code omit-when-empty (L8), `useRef` debounce per-instance (L9), `isVideoUrl` for preview (L10), optional-chain in VMSDetail (L12), `ModalVMSScreen` null guard (L13), `ModalUpdateSchedule` fallback Empty (L15), dead code removed (L17a–e). *(A later, unrelated contract change temporarily re-broke the build — see "Schedule API v2 restructure" below, resolved same day.)*

### Schedule API v2 restructure (2026-07-02) — RESOLVED

The VMS media/schedule contract changed from a **flat single-media model** to a **nested `schedules[]` array model**: a setting now owns N schedule rows, each with its own days-of-week, time window, and media (image/video *or* text) — not one flat media blob per setting.

**New contract** (`src/types/control-vms/vms-api.ts`, `src/types/control-vms/display-api.ts`):
- `APIRequestPostVMSMedia` / `APIRequestPutVMSMedia` (identical shape): `{ date_since, date_to, is_all_day, schedules: VMSMediaSchedule[], setting_type_id, type_name, vms_ids }`, where `VMSMediaSchedule = { days_of_week, media_url, message, schedule_name, time_since, time_to }`.
- `APIResponseVMSMediaById` — lost top-level `since`/`to`/`media_url`/`message`; gained `date_since`, `date_to`, `is_all_day`, `status`, `status_updated_at`, and `schedules: MediaScheduleByID[]`.
- `VMSMediaList` — lost top-level `media_url`; now `schedules: MediaSchedule[]`.
- `SettingByRoad` — `since`/`to` renamed to `start_date`/`end_date` (+ new `status`/`status_name`).

**`FormAddDetail.tsx`** (`sections/vms/FormAddDetail.tsx`, VMS-tab create form) is the canonical implementation of the new model — reference it before writing any other schedule-editing UI:
- `useFieldArray({ name: 'schedules' })` manages N rows (`schedule_name`, `days`, `start_time`, `end_time`, `media_type`, `file_url`/`text`), each independently image/video or text.
- **`DayList`** (`src/components/list/DayList.tsx`, new) — shared Mon–Sun day-of-week toggle, values `1`–`7`. Reuse this for any future day-picker instead of building a new one. Extended 2026-07-03 with an optional `getTooltip?: (day: number) => React.ReactNode` prop — wraps that day's button in an antd `Tooltip`+`<span>` (works even in a read-only/no-`onChange` usage, since native `disabled` blocks hover events on the bare button). Used by the status section to show every schedule's time range for a given day.
- `availableDays` is derived from the start/end date range (`useMemo`) and synced into every row's `days` via `useEffect`, disabling days outside the display window.
- Cross-schedule time-overlap validation on `start_time`/`end_time` — a row's window must not overlap any earlier row's window.
- `is_all_day` (`display_type === 'ALL_DAY'`) forces every row's `time_since`/`time_to` to `00:00`/`23:59` regardless of picked times.

**Fixed 2026-07-02** (plan `C:\Users\PorNe\.claude\plans\api-components-majestic-eclipse.md`, scope expanded to every control-vms file this restructure broke):
- **`FormUpdateSchedule.tsx`** rewritten to the `schedules[]` model, mirroring `FormAddDetail`'s structure (`useFieldArray`, `DayList`, per-row `TimePicker` + overlap validation, `ALL_DAY`/`SCHEDULE` toggle) while keeping its own จุดติดตั้ง VMS picker and `Dayjs`-typed date-only pickers (`BuddhistDatePicker` is `generatePicker<Dayjs>`). EDIT seeds `schedules` from `data.schedules[]`; the `availableDays` sync effect skips its first run (via a `useRef` guard) and *prunes* rather than replaces on later date changes, so it doesn't clobber seeded `days_of_week` on mount — the hazard flagged below no longer applies.
- **`ContentDeleteSchedule.tsx`** — `since`/`to` → `date_since`/`date_to`.
- **`ContentSetting.tsx` / `ModalMediaPreview.tsx`** — a setting can now own multiple schedules, some possibly TEXT-only (no media). Added `getPrimaryMediaUrl(schedules)` (`overall/data/media.ts`, alongside `isVideoUrl` as the other single-source-of-truth media helper) — first schedule with a non-empty `media_url`, else `''`. The grid card falls back to an `Empty` placeholder when a setting has no media (previously would have rendered a broken image).
- **`src/schemas/control-vms.ts`** — `vmsMediaListSchema`, `apiResponseVMSMediaByIdSchema`, `apiResponseVMSUpcomingSummarySchema`, `settingByRoadItemSchema` updated to the v2 shape; new shared `mediaScheduleSchema` (reused by both media-list and media-by-id schemas, since `MediaSchedule`/`MediaScheduleByID` are structurally identical). Test fixtures in `control-vms.test.ts` updated to match — also fixed a pre-existing fixture bug where the by-road test was missing the already-required `region_name` field.
- **`DisplayTableData.tsx`** — removed a leftover debug `console.log`, and fixed a `rowKey` regression that used bare `solution_name` (colliding when the same VMS appears in multiple schedule rows) instead of a composite key.

Verified: `npx tsc --noEmit` clean for every control-vms file (only the 2 pre-existing, unrelated `MaintenanceService.ts` errors remain — untouched, different feature); ESLint clean on all touched files; all 62 unit tests pass (`control-vms.test.ts` now 19, up from 16); `next build`'s Turbopack compile step succeeds for the whole app (the build's separate full-project TS gate still fails only on the pre-existing `MaintenanceService.ts` error). **Not verified**: interactive browser click-through — no browser automation tool was available in this environment and the DISPLAY-tab route is RBAC/session-gated, so the CREATE/EDIT/DELETE flow has not been exercised end-to-end against a live backend.

**EDIT-mode hazard (resolved above, kept for reference)**: `FormAddDetail`'s `availableDays` sync effect unconditionally overwrites every row's `days` — correct for CREATE (rows start empty) but would clobber seeded `days_of_week` on an EDIT form's mount. `FormUpdateSchedule` guards against this with a first-mount skip + prune-not-replace; keep this in mind if `FormAddDetail` is ever reused for editing.

### status sub-module (2026-07-03) — canonicalized + batch-delete fixed — RESOLVED

A new **STATUS** tab exists in `control-vms/overall`: `components/StatusSection.tsx` → `sections/status/ContentTab.tsx` → `StatusTabContent.tsx` → `StatusList.tsx`; `ModalStatusVMSScreen` (barrel alias for `sections/status/ModalVMSScreen.tsx`, a status-scoped near-duplicate of `sections/vms/ModalVMSScreen.tsx`); `ContentBatchDelete.tsx`/`FormUpdateBatch.tsx` (batch-cancel flow), reached via `updateScheduleState.type === 'BATCH_DELETE'` in the shared `ModalUpdateSchedule`.

It was originally added with 4 endpoints wired ad-hoc — a 2026-07-03 3-agent audit found: inline `useQuery` in `StatusTabContent.tsx`/`ContentTab.tsx` sharing a raw, colliding key prefix (`['status_count']` / `['status_count', statusId]` for two *different* endpoints); `getVMSSettingStatusAPI` (`/vms/settings/statuses`) with zero consumers; and `postVMSMediaBatchDeleteAPI` (`POST /vms/settings/schedules/batch-delete`) defined but never called — instead, `ContentBatchDelete.tsx` collected `schedule_ids` via checkboxes but its confirm button called `useDeleteVMSMedia` (single `DELETE /vms/settings/media/{id}`), silently deleting the *entire* setting record regardless of selection.

**Fixed same day**, per the audit's plan:
- **`overall/data/queryKeys.ts`** — added `byStatus()`/`byStatusList(statusId)`/`statusCounts()` (prefix/leaf convention, matching every other domain).
- **New hooks** `overall/hooks/useVMSSettingStatusCount.ts` and `useVMSSettingByStatus.ts` — replace the inline `useQuery` calls in `ContentTab.tsx`/`StatusTabContent.tsx`, eliminating the raw colliding key.
- **`src/schemas/control-vms.ts`** — added `apiResponseVMSSettingByStatusSchema`, `apiResponseVMSSettingStatusCountSchema`, `apiResponsePostVMSPatchDeleteSchema` (the last reuses the shared `apiResponsePostSchema`); matching tests in `control-vms.test.ts` (62 → 69).
- **New mutation `overall/hooks/usePostVMSBatchDelete.ts`** — wraps `postVMSMediaBatchDeleteAPI` for real, mirroring `useDeleteVMSMedia`'s toast/AxiosError/invalidation shape; additionally invalidates `mediaDetail(id)` for the parent setting so its remaining-schedules view refreshes.
- **`invalidateVmsMediaWrites.ts`** — extended to also invalidate `byStatus()` and `statusCounts()`, so the STATUS tab refreshes after *any* control-vms write (create/edit/delete/batch-delete), not just status-scoped ones.
- **`FormUpdateBatch.tsx`** — de-stubbed into a controlled presentational field (`value`/`onChange` props instead of owning its own `useForm`); **`ContentBatchDelete.tsx`** now owns the RHF form + `usePostVMSBatchDelete`, submitting only the checked `schedule_ids` to the real batch endpoint. `ModalUpdateSchedule.tsx`'s `BATCH_DELETE` branch simplified accordingly (dropped the unused `vmsOption` prop).

**Context exception (unaffected by the above, still true)**: the status VMS-screen modal's `open`/`id`/`vms_url` state lives in `ControlVMSContext` (`openVMSScreen`/`setOpenVMSScreen`/`INIT_OPEN_VMS_SCREEN`), unlike every other control-vms/overall modal (which owns local `useState` — see "Modal state is local" above). Deliberate, mirrors `vms/detail`'s `DetailContext` pattern. Mounted once at `StatusSection.tsx`, not per-`StatusList`-card, since `StatusList` renders in a `.map()` and a per-card mount would stack duplicate modal overlays sharing the same context state.

**Verified**: `npx tsc --noEmit` clean (only the pre-existing, unrelated `MaintenanceService.ts` errors remain); ESLint clean on all touched files; 69/69 unit tests pass; `next build`'s Turbopack compile step succeeds for the whole app (the build's separate full-project TS gate still fails only on the pre-existing `MaintenanceService.ts` error). **Not verified**: interactive browser click-through — no browser automation tool was available and the route is RBAC/session-gated.

**`FormSearchStatus` search — wired 2026-07-03 (client-side filter, not a backend param)**: `APIRequestVMSSettingByStatus` only has `status_id` — no documented search/`solution_name` param on `/vms/settings/by-status` — so this is deliberately a client-side filter, not a speculative backend contract addition. `setStatusSearchText` (new `ControlVMSContext` state, `string`, default `''`) is set from `FormSearchStatus`'s existing 700ms-debounced submit; `StatusTabContent.tsx` filters its already-fetched by-status list with `setting.solution_name.toLowerCase().includes(search)` (memoized), falling back to `<Empty description="ไม่พบข้อมูล" />` when the filtered result is empty. Also fixed in the same file: `FormValues.search` was typed as the literal `""` instead of `string`.

**Still explicitly deferred** (separate, smaller task, never in scope here): `SearchStatusSection`'s export button is unwired, `ContentTab`'s `defaultActiveKey='all'` never matches a real tab key (`String(status_id)`), `StatusList` has a `rounded-lgh-full` className typo, `StatusTabContent` uses an array-index React key. `getVMSSettingStatusAPI` (`/vms/settings/statuses`) still has no consumer — not wired speculatively.

### confirm-create flow + จัดการประเภท manage-types (2026-07-04) — audited and canonicalized — RESOLVED

Two more flows were added to `control-vms/overall`. A 27-agent canonical audit (read-only, adversarially verified) found 2 HIGH + 3 MEDIUM + ~16 LOW deviations from this file's own conventions. **All fixed same day** per plan `C:\Users\PorNe\.claude\plans\api-sub-groovy-parnas.md`.

**Confirm-before-create.** `FormAddDetail`/`FormUpdateSchedule` no longer write directly — both call `setOpenConfirmCreate({ open: true, ids, body })` (context state), which opens `ModalConfirmCreate` → `ContentConfirmCreate`. That component fetches the VMS's *current* command via `GET /vms/settings/by-vms-ids` (`useVMSSettingByVMSID`, key `controlVmsKeys.byVmsIds(ids)`) and renders "คำสั่งเดิม" (current, about to be replaced) vs "คำสั่งใหม่" (pending) side by side; only on explicit confirm does it call `usePostVMSMedia`.
**Fixed:** `ModalConfirmCreate` was mounted twice (`VMSSection.tsx` + child `DetailSection.tsx`) — the `DetailSection` mount was removed, keeping the single tab-root mount. `ContentConfirmCreate`'s `renderCurrentSchedule` now guards `if (!data || data.length === 0)` instead of just `if (!data)`, so an idle VMS (no current command — `by-vms-ids` returns `[]`, a normal case) no longer crashes; `renderCurrentScheduleTime` also tolerates an absent array via `(schedule ?? [])`. `renderPopoverContent` now uses `(data ?? []).slice(1).map(...)` instead of `if (index===0) return` (a `.map()` callback must never return `undefined`). Array-index React keys in `ContentConfirmCreate` replaced with `schedule_name`/`time_since`/`solution_name` composites. The dead `ScheduleByVMSID.duration` field (never read — hours were always recomputed from `time_since`/`time_to`) was removed from the type.
`invalidateVmsMediaWrites` now also invalidates a new `controlVmsKeys.byVmsIdsPrefix()` key (added alongside the existing `byVmsIds(ids)` leaf, same prefix/leaf convention as `media()/mediaList(id)`) — previously a write never invalidated this read, so re-opening the confirm dialog for the same VMS within the 60s `staleTime` window could show a stale "คำสั่งเดิม".
`FormAddDetail.onSubmit` now maps the validated `data.schedules` (the `handleSubmit` argument) instead of the `schedulesWatch` `useWatch` snapshot — matches how the canonical sibling `FormUpdateSchedule` does it; `schedulesWatch` is still used elsewhere in the file (media-section rendering), just no longer inside submit.

**จัดการประเภท (manage setting types).** `DetailTabContent`'s "จัดการประเภท" button opens `ModalUpdateType` → `FormUpdateType`, an inline editable list backed by 3 mutation hooks — `usePostVMSSettingType` / `usePutVMSSettingType` / `useDeleteVMSSettingType` (`overall/hooks/`) — wrapping the `/vms/settings/types` POST/PUT/DELETE service fns that existed since 2026-06-23 but had **zero consumers** before this. Per-row UI rule (deliberate product spec — keep as-is, do not "fix" without asking): a row shows `TbTrash` (`fs-18 text-red-500`) while clean; the instant its text differs from what's saved, the icon swaps to an AntD `Button` — "แก้ไข" for an existing row, "เพิ่ม" for a still-unsaved draft row. Consequence, accepted: an existing row cannot be deleted while mid-edit without clearing the field first.
**Fixed:** per-row pending state for a new/draft row is now keyed on the row's own stable field key (`addingKey` state, set right before `.mutate()`) instead of the submitted text value — previously two draft rows typed with identical text both showed loading when only one was actually in flight. The server-sync `useEffect` now also prunes local rows (`id !== null`) whose id is no longer present in the fetched list, so a type deleted elsewhere doesn't linger as a stale, actionable row.
**Modal-state — investigated, kept as a second documented exception (not moved):** `openUpdateType` stays in `ControlVMSContext` rather than local `useState`. The audit's proposed fix (co-locate in `DetailTabContent`) doesn't fit: `DetailTabContent` itself renders from **two different parent trees** — inline in `DetailItemStorage`, and again nested inside `ModalDetailItemStorage`'s "ดูเพิ่มเติม" gallery modal — both of which can be mounted at once. Local state there would either duplicate the `ModalUpdateType` mount point or require prop-drilling the open/close callback through 3+ component levels to reach the one safe mount site (`VMSSection`). Context is the pragmatic, correct choice here for the same reason as the already-documented `openVMSScreen` exception (see "Modal state is local" above) — `openUpdateType` is now a second sanctioned exception to that rule, not a bug.

**Schema/test coverage completed:** added `apiResponseVMSSettingByVMSIDSchema`, `apiResponseVMSSettingListSchema`, and `apiResponsePostVMSSettingTypeSchema`/`apiResponsePutVMSSettingTypeSchema`/`apiResponseDeleteVMSSettingTypeSchema` (all three alias `apiResponsePostSchema`, same as batch-delete) to `src/schemas/control-vms.ts` + matching tests (69 → 77). Also fixed a genuine type/schema mismatch unrelated to the two new flows: the only existing schedule schema validated `APIResponseVMSSettingSchedule` (a flat array type that **no service fn returns**), while `getVMSSettingScheduleAPI` actually returns `APIResponseVMSScheduleByDate` (a `Record<date, VMSScheduleByDate[]>`) — the orphan type + schema were removed and replaced with `apiResponseVMSScheduleByDateSchema` (`z.record(z.string(), z.array(...))`) matching the real contract.

**Naming fixed:** the batch-delete request/response types and their zod schema were renamed from `...PatchDelete` to `...BatchDelete` (`APIRequestPostVMSBatchDelete`/`APIResponsePostVMSBatchDelete` in `display-api.ts`, `apiResponsePostVMSBatchDeleteSchema` in `schemas/control-vms.ts`) — the endpoint, service fn (`postVMSMediaBatchDeleteAPI`), and hook (`usePostVMSBatchDelete`) already said "Batch"; only the types/schema/test said "Patch". When naming a new request/response type, copy the endpoint's own wording exactly.

**Hooks count: 19** in `overall/hooks/` (was 15 as of 2026-07-03) — `useVMSSettingByVMSID` (read) plus the 3 setting-type write hooks above.

**Status-tab nits fixed in the same pass** (cheap, same audit): `ContentTab`'s `Tabs` now uses `defaultActiveKey={String(data?.data?.[0]?.status_id ?? '')}` instead of the never-matching literal `'all'`; `StatusList`'s dead `rounded-lgh-full` Tailwind class removed; `StatusTabContent`'s `.map()` now keys on `setting.setting_id` instead of the array index (the list is search-filtered and renders stateful `HLSLivePlayer`s, so index keys could reuse the wrong player as the filter narrowed).

**Verified:** `npx tsc --noEmit` clean (only the 2 pre-existing, unrelated `MaintenanceService.ts` errors remain); ESLint clean on every touched file (only pre-existing warning patterns already used elsewhere — empty `Props` interfaces, `{ field: _, ...rest }` destructuring); 77/77 unit tests pass (up from 69); `next build`'s Turbopack compile step succeeds for the whole app (the build's separate full-project TS gate still fails only on the same untouched `MaintenanceService.ts` error). **Not verified:** interactive browser click-through — the route is RBAC/session-gated and no browser automation tool was available in this environment.

**Still explicitly out of scope** (need a spec / backend confirmation, not fixed speculatively): `SearchStatusSection`'s `นำออกเอกสาร` export button is unwired; `getVMSSettingStatusAPI` (`/vms/settings/statuses`) still has no consumer.

### ScheduleSection day-filter polish (2026-07-04) — RESOLVED

The DISPLAY tab's day-filter calendar (`FormSearchCalendar` badges + click-to-filter) matches by day-of-month (`DD`) against `GET /vms/settings/schedule`'s `Record<YYYY-MM-DD, ...>` response. **Confirmed correct by design, not a bug**: the endpoint always takes `month`+`year`, so its response is always a single month — `DD` can't collide within one month. Do not change this to full-date matching.

`ScheduleSection.tsx` fixes: `totalLocations`/`totalSchedules` now derive from `filteredSchedules` (the visible, day-filtered list) instead of the whole month, so the count badges always match what's rendered below them; the header shows `ตารางเวลาวันที่ {DD MMM BBBB}` when a day is selected, falling back to `ตารางเวลาเดือนนี้` when not (needs its own `buddhistEra`/`dayjs.locale('th')` — don't rely on `ScheduleList`'s import side effect); the empty state distinguishes `ไม่มีคำสั่งในวันที่เลือก` (day selected, none found) from `ไม่พบข้อมูล` (no day selected / error); `renderSchdeuleList` typo renamed to `renderScheduleList`. `ControlVMSContext`'s `searchDate` now initializes to `{ month, year }` for the current month instead of `null`, so the first fetch is explicit rather than relying on an assumed backend default.

Verified: `npx tsc --noEmit` clean (only the pre-existing `MaintenanceService.ts` errors); ESLint clean; 77/77 tests pass (schemas untouched by this change); `next build` Turbopack compile succeeds.

### settings — project detail page wired to real API + full CRUD (2026-07-18) — RESOLVED

`settings/overall` (list of projects/routes/contractors/users) had been backend-integrated since 2026-07-06, but `settings/detail/project` — the nested "จัดการข้อมูลโครงการ" page with routes → installation points → task types (Solutions) → equipment (Cameras) — was **100% mock** (all state in `useState<ProjectDetail>` seeded from a `MOCK_PROJECT_DETAIL` const). This slice replaced the whole mock scaffold with real API + built out modals for every solution type from the Figma spec + fixed the backend bugs the audit surfaced along the way.

**Overall project tab bugs (backend + frontend both patched):**
- `PUT /manage/project` reads the target id from a `?project_id=` **query** param (not body). `updateProjectAPI` was sending id in body only, so every update 400'd. Fixed at `src/services/routes/ManageService.ts:updateProjectAPI` — the `id` field is now extracted and passed as `params: { project_id: id }`.
- The same PUT create-a-duplicate on every re-save because the frontend didn't echo `project_road_id` on existing project-road rows and the backend interpreted `project_road_id=0` as "insert new". Fixed both sides: frontend `ProjectFormValues.roads` now carries `{roadId, projectRoadId?}` per row; the modal seeds `projectRoadId` from the fetched detail's `project_roads[i].project_road_id`, and `updateProject` echoes it back on PUT. Backend `manage/internal/dto/projects/repository.go:PutProject` was also patched to diff-delete removed `project_road` rows (rows in the DB not present in the incoming request are hard-deleted; FK violations from still-linked solution_locations bubble up as a 400).
- Both patches shipped in `Klanarm/drr_its_service` commit `f60e581` (backend) + the same commit range in `DevEnixma/drr-its-new` production.

**Real-API service + hooks + types for the detail page** (canonical pattern-2 shape — shared top-level hooks + query-key factory):
- **New types**: `src/types/manage/solution-api.ts` — 24 request/response shapes covering `/solution/road_solution`, `/solution`, `/solution/details/{id}`, `/solution/camera/list/{id}`, `/solution/camera/vms/{id}`, `/solution/camera/crossing_codes/{id}`, `/solution/type`, `/solution/type/{id}`, `/equipments`, plus `SOLUTION_TYPE` enum (1 CCTV, 2 Counting/Traffic Volume, 3 Analytic/Incident Detection, 4 Traffic/Traffic Signal, 5 Crosswalk, 6 Lighting/Traffic Lighting, 7 VMS, 8 Tunnel, 9 WIM/Tracking, 10 BridgeLighting), `GeometryPoint` (GeoJSON — backend rejects WKT), `APIRequestLightingConfig`, `APIRequestBridgeLightingConfig`.
- **New service wrappers**: `src/services/routes/SolutionService.ts` (24 endpoints) + camera CRUD (`createCameraAPI` / `deleteCameraAPI` / `updateCameraAPI`) appended to `src/services/routes/CCTVService.ts` — `POST /cctv/cameras` is a *different service* (port 8004) than `/manage/*`, so camera create hits it directly.
- **New hooks**: `src/hooks/queries/manage/solution.ts` (24 hooks — reads + mutations for road_solution/solution_location/solution/all six camera-attach flows + VMS provisioning + WIM station link) + `src/hooks/queries/manage/camera.ts` (`useCreateCamera`/`useDeleteCamera`/`useUpdateCamera`). All exported from the barrel. Every mutation invalidates the entity's `.all` key + relevant `.detail(id)` + related dropdowns; the `queryKeys.ts` factory grew `roadSolutions`, `solutions`, `equipments`, `solutionTypes` nodes with the standard `all/list/detail/byLocation/typesAtLocation/camerasAtLocation/vmsCameras/crossingCodes` prefix/leaf convention.
- **Context** (`src/features/admin/settings/detail/project/context/index.tsx`) — fetches `useProjectDetail` + `useRoadSolutions` at mount, lazy-fetches `useSolutions(activePointId)` + `useSolutionCameras(activePointId)` for the active point only (avoids N+1 fan-out for inactive points), wraps every mutation with `message.success`/`errText`, no server data in state (only `activeRouteId`/`activePointId`).
- **Screen** routes the per-type "add equipment" modal by `solution_type_id`: CCTV → `EquipmentCCTVListModal` (list + `POST /cctv/cameras`), Traffic Signal → `TrafficSignalCameraModal` (per-row phase + `camera_type` picker), VMS → `VMSSolutionModal` (one-shot `POST /solution/vms/solution` provisioning), everything else → generic `EquipmentSelectModal` (routes Counting/Analytic/Crosswalk/WIM to their respective `useAttach*Cameras` hooks).

**Modals shipped** (`.../detail/project/components/modals/`):
- `AddPointModal` (create/rename `tbl_solution_location`), `AddTaskTypeModal` (create Solution — conditional fields for WIM `station_id`, Lighting IoT4G-67 `imei/phase_type/sem_type/diagram_type/connection_type/send_frequency`, BridgeLighting `wid`), `AddCCTVEquipmentModal` (create Camera via `/cctv/cameras`), `EditSolutionModal` (`PUT /solution/{id}` with the fetch-then-key trick — Form remounts when detail resolves), `EquipmentCCTVListModal` (list + per-row delete), `EquipmentSelectModal` (generic camera picker, replace-on-write), `TrafficSignalCameraModal` (reuses `PHASE_COLORS`/`getPhaseColor` from `traffic-signal/overall/data/trafficSignals.ts` — the only cross-feature import; note the backend `camera_type` enum literals are `'Counting' | 'StopLine'` (case-sensitive) not `'Stopline'`), `VMSSolutionModal` (`useFieldArray`-style camera repeater lifted from `control-vms`'s `FormAddDetail.tsx`), `CrossingCodeModal` (read-only, guarded on Counting/Analytic/Traffic/Crosswalk types only — backend 404s for other types), `LiveStreamModal`, `ConfirmDeleteModal` + `CannotDeleteModal`. `RouteTabs` gained a "ลบสายทางนี้" button wired to `useDeleteProjectRoad`.

**Backend contract quirks discovered — all reflected in current code + memory:**
- `geometry_point` on POST/PUT is a **GeoJSON `{type:'Point',coordinates:[lng,lat]}`** object; WKT strings 400 with "unable to unmarshal geometry data". Longitude is FIRST. GET responses ship as a bare `[lng, lat]` array on some endpoints and as GeoJSON on others — read-side type is `GeometryRead = GeometryPoint | [number, number]`.
- Optional `*string` fields on `POST /manage/solution` (`ip_address`, `zt_ip_address`, `anydesk_id`, `remarks`) crash the service with a nil-deref if omitted from the JSON. Frontend now sends `""` (not `undefined`) for them; backend `service.CreateSolution` was also patched to guard `req.Remarks` (`Klanarm/drr_its_service` commit `f60e581`).
- `/solution/road_solution` GET keys the primary key as `project_road_id` (per the model's `json:"project_road_id"` tag on `ProjectRoads.ID`) — not `id`. `solution_locations` may be `null`. `/solution/camera/list/{id}` returns `null` (not `[]`) when no CCTV solutions exist there — the hook normalizes.
- Camera-attach endpoints for Counting/Analytic/Crosswalk/WIM/Traffic are **replace-on-write** (backend deletes existing link rows then re-inserts). VMS's `POST /solution/camera/vms` is **append-only** — different pattern. Deleting a solution with cameras still attached FK-fails; UI must detach first (send empty array through the same attach endpoint).
- `/manage/equipments` requires **both** `road_id` AND `solution_location_id` even to mean "no filter" — pass 0. `EquipmentListParams` type enforces this.
- `WIM.station_id` on POST /solution type=9 was nil-deref'd if omitted; `manage/repository.go:CreateSolutionWithRelated` case 9 now returns a clean 400 instead. Same fix pattern was applied to case 10 (BridgeLighting) — see below.
- `POST /manage/solution/camera/wim` used to `Delete(&models.Wim{})` (deleting the *parent* Wim row on every detach) instead of `Delete(&models.WimCamera{})`. Fixed in the same commit — verified by attaching then detaching a camera and confirming the parent Wim row survived.

**Backend Lighting + BridgeLighting create fan-out** (`Klanarm/drr_its_service` commits `ff1f03f`, `2708356`):
- `CreateSolutionWithRelated` now handles case 6 (Lighting) and case 10 (BridgeLighting) alongside 4/5/9. Case 6 mirrors the `migration/internal/migrator/lighting.go` shape: creates `tbl_lighting` row + `tbl_lighting_iot` + `tbl_lighting_iot_status` (with `line_check1..8=1`) for IoT4G-67, or `tbl_lighting_lora_status` for Lora_Gateway. Case 10 creates `bridge_lighting.tbl_bridge_lighting` with `solution_id` + `wid`.
- `RequestCreateSolution` gained optional nested `Lighting *LightingConfig` and `BridgeLighting *BridgeLightingConfig` blocks so a single `POST /solution` provisions the whole tree in one call.
- Wrapped the whole function body in `r.db.Transaction(...)` — before this, a failed side-table insert (missing wid, duplicate wid, missing station_id) would leave an ORPHAN `tbl_solution` row. Now they roll back atomically.
- `service.DeleteSolution` gained case 10 (`repo.DeleteBridgeLighting`) so cascading cleanup wipes the bridge_lighting row alongside the solution.

**New DB migration** (`db_migrations/2026-07-18_bridge_and_lighting.sql`, applied 2026-07-18):
```sql
ALTER TABLE lighting.tbl_lighting_iot
  ADD COLUMN IF NOT EXISTS connection_type text,
  ADD COLUMN IF NOT EXISTS send_frequency  text;
```
The two Figma dropdowns ("ประเภทการเชื่อมต่อ", "ความถี่การส่งข้อมูล") that previously had no persistence target now write to these columns as free-text (matches the surrounding schema style — `phase_type`/`sem_type`/`diagram_type` are all `text` too).

**Data-fetching pattern used**: pattern 2 (shared top-level hooks + query-key factory). Deliberately NOT pattern 1 — the settings surface doesn't benefit from feature-colocation the way control-vms does, and pattern 2 keeps the manage-service hooks discoverable from a single `@/hooks/queries/manage` barrel. Zod schemas are still missing (as of this slice) — an intentional gap consistent with everything else under `manage/*`, tracked in the "Zod response validation" note above.

**Not verified**: interactive browser click-through. All CRUD flows were exercised via `curl` end-to-end (create project → point → CCTV+Traffic Volume+Lighting+Bridge Lighting solutions → cameras → attach → crossing_codes → delete, with clean cleanup); the route is RBAC/session-gated and no browser automation tool was available in this environment.

### bridge-lighting — real-time status wired via dual-write (2026-07-18) — RESOLVED

`bridge-lighting/` (decorative lighting on bridges — separate feature from `traffic-lighting`) already had a *detail-side* infrastructure in place (7 service fns in `BridgeLightingService.ts`, 5 hooks including `usePostOpenBridgeLighting`/`useBridgeLightingPmChart`/`useBridgeLightingShellyStatus`/`useBridgeLightingWID`/`useBridgeLightingDetailMap`, and full detail sections including the SVG bridge visualization). What was missing:
1. A way to **create** a Bridge Lighting solution from the settings page — covered by the settings/detail slice above (case 10 in `CreateSolutionWithRelated`).
2. Real-time Shelly status data landing in the new PG at all — every read via `/api-v2/bridge_lighting/*` was proxying to the *legacy* PG (`100.66.158.128/drr_its` via Tailscale) which is where the its-api-go MQTT sweeper wrote.

Both are closed this slice. Shelly live state (on/off, apower, voltage, current, aenergy_total, temperature_c) + command log now dual-write into `bridge_lighting.tbl_shelly_state / _command_log` on the new PG alongside the legacy writes. See `DevEnixma/its-api-go` commit `eae9a46` (adds `internal/db/postgres_new.go` with `search_path=bridge_lighting,public` pinned in the DSN so the same legacy SQL retargets automatically, `internal/shelly/mirror.go` soft-fail helper, and 8 patched write sites in `service.go`) + `Klanarm/drr_its_service` `db_migrations/2026-07-18b_bridge_lighting_shelly_mirror.sql` (creates `tbl_shelly_{device,state,command_log,schedule}` under `bridge_lighting.*`; FK from state → device was DROPPED for orphan tolerance since admin CRUD still writes to legacy only). Backfilled 2026-07-18: 10 devices + 10 state rows + 149 command_log rows via `psql | psql` COPY pipe. Env overrides on `its-api-go.service`: `PG_NEW_HOST/PORT/USER/PASSWORD/DBNAME/SEARCH_PATH` — defaults are the production values.

Also added `POST /api-v2/gateways/wim/heartbeat {station_id}` (`Klanarm/drr_its_service` `2708356`) — bumps `wim.tbl_wim.wim_connected_at`; replaces the misrouted node-red@1 flow on `10.10.0.106:1880` that had been pointing at an invalid IP (`192.168.195.82/drr_its_new`) and left the WIM liveness column stale since 2026-05-07. Returns 404 clean when the station_id doesn't exist.

**Still explicitly out of scope for this slice** (`overall/` list + map still read-only from the existing proxied endpoints; those work but were not migrated to a query-key factory — carry the same technical debt the "traffic-lighting" feature does): a full pattern-2 rewrite of `bridge-lighting/overall`. Not planned here.

### tracking/detail/wim — migrated to control-vms parity (2026-07-09) — RESOLVED

`tracking` was the least-disciplined backend-integrated feature (pattern 3 everywhere, 63 inline `useQuery` call-sites, zero hooks, no query-key factory, no Zod schemas, `any`-saturated types). Following a `/goal`-driven implementation of a pre-analyzed plan, `detail/wim` — the module backing both the WIM and STATION detail routes (`app/admin/tracking/detail/station/[id]/page.tsx` imports the same `wim/screen`) — was migrated to the **feature-colocated hooks** pattern (pattern 1), mirroring control-vms exactly rather than the pattern-2 default, since the explicit ask was parity with that specific reference implementation. `overall/`, `gps`, `license`, `mobile` remain pattern 3 — deferred to a later rollout using this same template.

**New structure** (`src/features/admin/tracking/detail/wim/`):
- **`data/queryKeys.ts`** (`trackingWimKeys`) — flat prefix-per-domain factory rooted at `['tracking', 'wim-detail']`, mirroring `controlVmsKeys`'s style. This root alone resolves two of the found bugs below (see "Bugs found and fixed").
- **`hooks/`** — 15 files. Twelve thin one-hook-per-endpoint reads (`useStationById`, `useWimById`, `usePositionById`, `usePCU`, `useCalibrationHistory`, `useWeightWimLog`, `useWeightStationLog`, `useStationDaily`, `useWimDaily`, `useLast7Days`, `useTrafficAvgSpeed`, `useCctvList`) plus **3 composites** that centralize the WIM/STATION branching previously smeared across ≥4 components:
  - `useStationDetail(id, stationType)` — picks `useStationById`/`useWimById`; both response shapes share `station_name`, so no normalization needed (used by `TitleSection`).
  - `useDailyWeightLog(id, stationType)` — picks `useWeightWimLog`/`useWeightStationLog` **and normalizes the row shape** into `NormalizedDailyLog`/`NormalizedDailyLogItem` (see "Bugs found and fixed" below). Used by `OverallWeightStat`, `OverallStatCard`, `CardDailyWeight`, `CardDailyOverweight` — none of these components branch on `stationType` anymore.
  - `useDailyTable(id, stationType)` — picks `useStationDaily`/`useWimDaily`. Kept as a **discriminated union** (`{ kind: 'STATION' | 'WIM', data, isLoading, isError }`) rather than normalized, since `TableLatestStation`/`TableLatestWIM` remain genuinely separate presentational components (not merged — that's a real, separate near-100%-duplication finding, intentionally left for the future rollout, not this slice).
  - `index.ts` barrel re-exports the factory + every hook.
- **`src/components/common/QueryBoundary.tsx`** — new shared `{isLoading, isError, skeletonRows?, emptyDescription?}` wrapper (searched first — none existed in the repo). Replaces the `if (isLoading) <Skeleton/>; if (isError) <Empty/>` ladder copy-pasted across every `detail/wim` data component.
- **`src/constants/tracking.ts`** — added `TRACKING_STATION_TYPE = {STATION:1, WIM:3}` + `toStationTypeId(name)`. Named `TRACKING_STATION_TYPE`, not `STATION_TYPE` — `constants/vehicle.ts` already exports an unrelated `STATION_TYPE` (vehicle-inspection-unit-type strings), and the `@/constants` barrel's `export *` would ambiguous-collide otherwise.
- **`src/schemas/tracking.ts` + `.test.ts`** (new, 18 tests) — one `apiResponseTracking*Schema` per response type the `detail/wim` hooks consume, following the `crosswalk.ts` `satisfies z.ZodType<...>` template; `WeightWIMLogData`/`WeightStationLogData`'s many `any`-typed axle/weight fields are schema'd as `z.any()` (retyping the underlying 256 `any`s repo-wide is out of scope). Like control-vms/crosswalk, these are compile-time-checked test fixtures, not wired into the runtime `queryFn`.
- **Empty `WIMProvider`/`WIMContext` deleted** (`detail/wim/context/` — was `value={{}}`, zero real consumers, confirmed by grep before deletion) — violated the "no empty Context" rule; `screen/index.tsx` no longer wraps in it.
- **`OverallSection.tsx`** — the god-component (6 inline `useQuery` + a commented-out 7th + manual `isDailyLogLoading/Error` derivation) is now ~20 lines of hook calls + `<QueryBoundary>` wrappers.

**Bugs found and fixed:**
- **`['wim_cctv_list']` cache-key collision** (`overall/`-scoped, between `WIMCCTVList.tsx` and `MobileStationData.tsx`) and the hand-duplicated `['tracking_avg_speed', stationId]` (between `detail/wim`'s `OverallAvgSpeed.tsx`/`ChartTraffic.tsx`) are structurally impossible once every key is minted from a factory — the `detail/wim`-scoped one is fixed (`OverallAvgSpeed`/`ChartTraffic` now both call `useTrafficAvgSpeed`, sharing one factory key); the `overall/`-scoped `wim_cctv_list` collision is a **different module**, still open, deferred to the rollout phase.
- **`gross_weight_over` vs `grossweight_over` field-name mismatch** — `WeightWIMLogData` and `WeightStationLogData` disagree on this field's name for the same concept. Previously every consuming component had to shape-sniff (`'gross_weight_over' in item ? ... : item.grossweight_over`); now `useDailyWeightLog` normalizes once, and `CardDailyWeight`/`CardDailyOverweight`/`OverallStatCard`/`OverallWeightStat` take one plain `NormalizedDailyLog` prop with no union type or narrowing.
- **`STATION=1`/`WIM=3` magic numbers** — replaced by `toStationTypeId()` everywhere in `detail/wim` (was an inline `switch` duplicated across `OverallSection`/`TitleSection`/`OverallCCTV`).
- **`id || 'ID_NOT_FOUND'`** in `app/admin/tracking/detail/wim/[id]/page.tsx` and `detail/station/[id]/page.tsx` — `'ID_NOT_FOUND'` is truthy, so downstream `enabled: !!id` guards never caught it and would have fired real API calls with a garbage id. Fixed with `if (!params.id) notFound()` (this exact `id || 'ID_NOT_FOUND'` pattern is copy-pasted across ~10 *other*, unrelated detail pages app-wide — e.g. `bridge-lighting`, `crosswalk`, `vms` — intentionally left alone; fixing those is a much larger, cross-feature change outside this slice's blast radius).
- **Stray `console.log(calibrationHistory, "===")`** in `OverallCalibrateWeight.tsx` — removed (was directly in this refactor's data path).

**Deliberately preserved, not "fixed" into new behavior:** `OverallAvgSpeed`/`ChartTraffic` (`useTrafficAvgSpeed`) and `ChartPreviousWeightVehicle` (`useLast7Days`) are still gated `enabled: stationType === 'WIM'` only — `traffic_avg_speed`'s endpoint URL is literally `/masters/wim/traffic_avg_speed/:id` (WIM-only by backend design); `last_7_days`'s STATION-support was never confirmed and widening it would be a behavior change, not a restructuring — left exactly as the pre-refactor code had it.

**Explicitly out of scope for this slice** (flagged for the `overall/`+`gps`+`license`+`mobile` rollout phase): the `overall/`-scoped `wim_cctv_list` collision above; hardcoded `station_id:'3'`/`'1'` magic values in `overall/`'s WIM/STATION CCTV-list components; 4 near-duplicate CCTV-list implementations across `overall/`; `TableLatestStation`/`TableLatestWIM` near-100%-duplicate presentational components (found this session, not merged — see hooks note above); mock-backed components (`TableOverallDailyWeight`, the VEHICLE tabs, `trackingStations.ts`).

**Verified:** `npx tsc --noEmit` clean (only the 2 pre-existing, unrelated `MaintenanceService.ts` errors remain); ESLint clean on every touched/new file; 109/109 unit tests pass (91 → 109, all 18 new in `tracking.test.ts`); `next build`'s Turbopack compile step succeeds for the whole app (the build's separate full-project TS gate still fails only on the same untouched `MaintenanceService.ts` error). **Not verified:** interactive browser click-through — the route is RBAC/session-gated and no browser automation tool was available in this environment.

## Backend sync worker landscape (added 2026-07-18)

The `drr_worker.service` on 10.10.0.104 runs 8 cron jobs plus 4 aggregations —
this is where legacy MySQL data flows into new PG (`its_db`), where the
dashboard's `is_online` flag comes from, and where auto-generated maintenance
cases originate. Read this before touching any feature that shows install-point
counts, camera lists, or offline pill colours.

| Job | Cadence | Source → Target |
|---|---|---|
| `VMSSync` | :00 + startup | legacy `tbl_work_master (type_name=TrafficSign)` → `vms.tbl_vms` + related |
| `BridgeLightingSync` | :00 + startup | legacy `tbl_work_master (type_name=BridgeLighting)` → `bridge_lighting.tbl_bridge_lighting` |
| `SolutionSync` | :30 + startup | legacy `tbl_work_master` (8 types) → `tbl_solution` |
| `CameraSync` | :45 + startup | legacy `tbl_cctv` → `cctv.tbl_camera` |
| `EnixmaURL` | :45 + startup | legacy `tbl_vmsscreen_enixma_provision` → `vms.tbl_vms_desktop_screen.desktop_screen` (via dblink) |
| `CaseAutoOpen` | :10/:30/:50 + startup | offline in-warranty solutions → `tbl_maintenance_case` (+ email vendor) |
| `VMSStatusProgress` | */5 min | `vms.tbl_vms_setting` stuck at status 0 → 3/4 |
| `Counting/Traffic/Crosswalk/Lighting agg` | :01 hourly | Hourly buckets |

Migration tracking: `public.tbl_work_master_migration` — composite PK `(wid, type_name)` because legacy tbl_work_master shares `id` across type_names for the same physical install-point.

is_online logic: manage service `/manage/solution/{deptId}/position` returns `is_online: boolean | null` via 6 LEFT JOIN LATERAL blocks gated on `ts.solution_type_id`. Thresholds: CCTV `bool_or(curl_status)` no window · Traffic `connection_status='connected' AND traffic_connected_at > NOW()-15m` · VMS `last_connected > NOW()-30m` · WIM `wim_connected_at > NOW()-30m` · Lighting `MAX(lighting_iot_status.last_update) > NOW()-60m` · BridgeLighting `last_update > NOW()-90m`.

## Maintenance case workflow (added 2026-07-18)

State machine: `open → in_progress → pending_approval → closed` (plus rejected → back to in_progress). `tbl_maintenance_case.camera_id` is nullable now; the row accepts any of `camera_id | project_id | solution_id`. `contractor_id` pins it to the vendor. `POST /manage/maintenance/case/{case_no}/approve` handles the officer close. `GET /manage/maintenance/contractor-summary` feeds `/admin/maintenance/contractor-summary` (per-vendor offline-device rollup). SMTP mailer at `worker/mailer/mailer.go` runs in log-only mode until env vars `SMTP_HOST/PORT/USERNAME/PASSWORD/FROM/FROM_NAME` are set on the service unit.

Contractor emails live in `tbl_contractors.email` (added 2026-07-18). Settings → ผู้รับจ้าง form now has an email input.

## Ticket 15 ก.ค. 2569 — status

All 8 top-level ticket items delivered live 2026-07-18. Session log + open follow-ups: see project-ticket-150769-status memory. FE features live: 18-สำนัก polygon overlay, road-code search, three-way hide dropdown, KPI tile row, CCTV nationwide search, Traffic phase arrows via `is_main_road`, Smart Search markdown-link + inline-image render, contractor summary page, seamless deploy pipeline.

Deploy RULE (2026-07-18 Keng): `/home/kaiser/auto-pull-build-its-new.sh` NEVER stops the service before `next build` — it does `mv .next .next.old → next build → systemctl restart → rm -rf .next.old`. Downtime ~2s, not 30-60s. Old script backed up at `.bak.pre-seamless`.

## Environment Variables

| Variable | Purpose | Note |
|---|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header | Visible to browser — security debt |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL | |
| `TOKEN_SECRET` | iron-session cookie encryption key | Must be set in env — has unsafe fallback in code |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | |
