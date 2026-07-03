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

## Environment Variables

| Variable | Purpose | Note |
|---|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header | Visible to browser — security debt |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL | |
| `TOKEN_SECRET` | iron-session cookie encryption key | Must be set in env — has unsafe fallback in code |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | |
