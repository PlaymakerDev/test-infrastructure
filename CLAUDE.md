# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 ITS (Intelligent Transportation System) dashboard for Thailand's Department of Rural Roads (กรมทางหลวงชนบท). It features CCTV management, vehicle tracking, VMS (Variable Message Signs), bridge lighting control, and traffic monitoring with live maps and video streaming.

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

## Data Fetching

Most feature data is still **mock/static** — hardcoded in `src/features/**/data/*.ts` files or inline in components. Backend-integrated so far:
- `GET /auth/me` via `src/services/routes/AdminService.ts`
- **`control-vms/overall`** — the first feature wired to the real backend (VMS departments, setting types, paginated media list, media create, file upload, contract detail). Services: `src/services/routes/ControlVMSService.ts` + `SharedService.ts`. Reads/writes use **TanStack Query** (`useQuery` / `useInfiniteQuery` / `useMutation`), **not** Redux. It is the canonical reference pattern — see full details in the section below.

Canonical pattern when connecting a feature to the real backend:
1. Add a typed service function to `src/services/routes/<Feature>Service.ts` using `ApiService.fetchData<ResponseType>()`
2. Fetch via **TanStack Query** in a co-located hook — `useQuery`/`useInfiniteQuery` for reads, `useMutation` for writes. Do NOT fetch in `screen/index.tsx`, do NOT call `fetch()` in components, and do NOT mirror server data into Redux.
3. Define the API response type in `src/types/<feature>/`

`ApiService.fetchData<T>()` returns `Promise<AxiosResponse<T>>`, so TanStack's `data` is the AxiosResponse — unwrap the payload with `.data`.

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

## Known Tech Debt & Pitfalls

These are **confirmed issues** from a full architecture review (2026-06-05). Avoid making them worse.

### Do NOT copy-paste feature section components
Shared primitives now exist in `src/components/section/` — use them instead of creating new per-feature copies:
- **`TitleSection`** (`components/section/TitleSection.tsx`) — accepts `title`, `subtitle`, optional `tabOptions`/`defaultTab`/`onTabChange`, `className`. 8 simple/tab feature copies migrated to thin wrappers; 14 detail-page variants (with back-button + feature-specific device data) remain as-is.
- **`StatCardRow` + `StatCard`** (`components/section/StatCard.tsx`) — accepts a `cards` array of `{icon, title, count, unit, activeLabel, color}`. Replaces the yellow/teal/gray 3-card layout used by bridge-lighting, crosswalk, incident-detection (3/7 InfoCardSection copies migrated). Remaining 4 have structurally different layouts.
- **`FeatureSectionLayout`** (`components/section/FeatureSectionLayout.tsx`) — accepts `top`, optional `middle`, optional `bottom` ReactNode props; renders 2 or 3 stacked sections. 13/18 OverallSection copies migrated. Remaining 5 have feature-specific logic (collapsible panels, Redux/context hooks, absolute-positioned overlays, multi-column grids) that cannot be safely abstracted.

`MapSection` (10 copies) and `DataDisplaySection` (8 copies) are too feature-divergent to extract — leave as-is.

### Unused / duplicate dependencies
- **`recharts`** — installed but used 0 times. Use ECharts wrappers in `src/components/chart/` instead.
- **`motion` + `framer-motion`** — both installed (same engine). Use `motion` only.
- **`better-auth`** — installed but not configured as auth layer. Do not `import` from it for new code.

### Placeholder files (not yet implemented)
- `src/app/page.tsx` — still the create-next-app default template. Redirect is handled in `next.config.ts`.

### Known bugs / tech debt
- **`src/services/RtkQueryService.ts:19`** — `axiosBaseQuery` was missing `await` on `BaseService(request)` (fixed 2026-06-24). RTK Query is still not wired to the store — TanStack Query is used for server state instead.

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

**`setting_id` IS accepted as the media `{id}`** (confirmed with backend 2026-06-25) — schedule rows expose `setting_id` (no separate media id); the backend aliases it so `GET/PUT/DELETE /vms/settings/media/{id}` work when called with `schedule.setting_id`. Do NOT "fix" this as an id-space mismatch. `GET /vms/settings/media/{id}` returns a rich detail shape (`solution_name`, `setting_type_name`, `department_short_name`, `date_count`, `since`, `to`, `media_url`, `message`, `setting_type`, …) — keep `APIResponseVMSMediaById` in sync with what the endpoint actually returns.

**Ant Design 6 `Select` — `filterOption` / `onSearch` are deprecated as flat props** — use the `showSearch` config object instead: `showSearch={{ filterOption: false, onSearch: handler }}` (type `SearchConfig`). For server-side search, pair with `onPopupScroll` for infinite scroll and a debounced `onSearch` (400ms via `useRef` timer, no external lib).

**Ant Design Calendar — `onSelect` fires before `onChange`** (`FormSearchCalendar`): when a date cell is clicked, `onSelect` fires first (before `onChange` commits the new value to React Hook Form). Always call `field.onChange(date)` inside `onSelect` before triggering the submit — do NOT rely on the Calendar's `onChange` prop having already updated the RHF field. Also: `dayjs().month()` is 0-indexed — add `+1` before sending to the backend.

**Media preview URL** — `postUploadVMSAPI` returns a full URL in `path`; store it directly as `file_url` and use as `previewSrc` without prepending the host. Backend `media_url` in GET responses is also a full URL. Do NOT prepend `NEXT_PUBLIC_HOST_BACKEND` to either.

**Ant Design `Radio.Group` + React Hook Form** — `field.onChange` for custom Ant Design components must receive the **value**, not the event object. Use `field.onChange(e.target.value)` (or the extracted `next` const), NOT `field.onChange(e)`. Passing the full `RadioChangeEvent` stores the event object as the field value, causing `useWatch` to return an object and `[object Object]` to appear in dependent inputs.

**Switching `display_type`** — on every Radio.Group `onChange`, clear all three: `setValue('text', ''); setValue('file_url', ''); setValue('file', [])`. This clears both the RHF state (`file_url`) and the Upload component's own fileList state (`file`). Without clearing `file`, the Upload preview remains visible in EDIT mode even after switching away.

**`SettingByRoad.setting_id`** — optional field `setting_id?: number` added to the interface. `DisplayTableData` uses it as `rowKey` when present, falling back to `solution_name-since-to` composite. Add `setting_id` if the backend `/vms/settings/by-road` endpoint returns it (avoids duplicate-key React warnings when the same VMS appears in multiple schedule slots).

**`VMSSettingByRoad`** now includes `region_name: string` (confirmed 2026-06-25).

**Unresolved data-contract questions** — verify with backend: does `GET /vms/settings/departments` return `Solution.vms_id`? (mock only has `solution_id`); and what `res_code` value means POST success?

**Audit complete (2026-06-25)** — the 54-agent correctness audit (17 issues, plan `mellow-tumbling-map.md`) is fully resolved. Build is clean (`npx tsc --noEmit` exits 0, 62 unit tests pass). All G1–G6 items addressed: API contract comments (H1), upload-in-flight guard (M1), badge dedup (M2), Radio.Group stale value (L2), `mediaDetail` key in factory + `useVMSMediaById` hook (L3), `invalidateVmsMediaWrites` helper (L4/L5), rowKey (L6), inner null guards (L7), road_code omit-when-empty (L8), `useRef` debounce per-instance (L9), `isVideoUrl` for preview (L10), optional-chain in VMSDetail (L12), `ModalVMSScreen` null guard (L13), `ModalUpdateSchedule` fallback Empty (L15), dead code removed (L17a–e).

## Environment Variables

| Variable | Purpose | Note |
|---|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header | Visible to browser — security debt |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL | |
| `TOKEN_SECRET` | iron-session cookie encryption key | Must be set in env — has unsafe fallback in code |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | |
