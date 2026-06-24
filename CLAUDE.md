# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 ITS (Intelligent Transportation System) dashboard for Thailand's Department of Rural Roads (กรมทางหลวงชนบท). It features CCTV management, vehicle tracking, VMS (Variable Message Signs), bridge lighting control, and traffic monitoring with live maps and video streaming.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run storybook    # Storybook component explorer on port 6006
```

There is no `npm test` script. Vitest runs through Storybook only (`npm run storybook` then the addon-vitest panel). There is also no `typecheck` script — run `npx tsc --noEmit` manually to type-check.

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
- `control-vms/overall` — bureau / sign / route / isAddMode
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
`TitleSection` (22 copies), `OverallSection` (18), `MapSection` (10), `DataDisplaySection` (8), `InfoCardSection` (7) already exist as near-identical copies per feature. When you need one of these, propose a shared component in `src/components/` that accepts props/config instead of adding another copy.

### Unused / duplicate dependencies
- **`recharts`** — installed but used 0 times. Use ECharts wrappers in `src/components/chart/` instead.
- **`motion` + `framer-motion`** — both installed (same engine). Use `motion` only.
- **`better-auth`** — installed but not configured as auth layer. Do not `import` from it for new code.

### Placeholder files (not yet implemented)
- `src/utils/allowAdmin.ts` — **empty file** (0 bytes). RBAC not implemented.
- `src/app/page.tsx` — still the create-next-app default template. Redirect is handled in `next.config.ts`.
- `src/features/manager/` and `src/features/user/` — empty placeholder directories.

### Known bugs (do not use until fixed)
- **`src/services/RtkQueryService.ts:19`** — `axiosBaseQuery` does `const response = BaseService(request)` without `await` inside `try`, so the `catch` block can never run. Fix: add `await` before using. (Still unfixed, but RTK Query isn't wired to the store anyway — TanStack Query is used for server state.)

> **BaseService was hardened (~2026-06-22, committed)** — the former "request hangs forever on `40199`" bug is fixed. `src/services/BaseService.ts` now has a 5s session promise-cache, a single-flight refresh lock, silent auto-refresh on `40199`/bare-401 (`_retry` guard, no confirm modal), and a `40100` guarded error modal with a null-modal→logout fallback. An untracked reference candidate remains at `test/BaseService.ts` — **ignore it** (imports a nonexistent `AuthService`, uninstalled `sweetalert2`, static antd `Modal`, and `/login`; the real bindings are `getGlobalModal()` + `/auth/login`).

### Logging in production path
- `src/app/api/auth/[...all]/route.ts:84` — `console.log("===", error)` leaks error details server-side. Remove before production. (The former per-request `BaseService.ts` log was removed in the 2026-06-22 hardening.)

### Missing route boundaries
No `error.tsx`, `loading.tsx`, or `not-found.tsx` exist anywhere in the app. Add these per-route when implementing a feature properly (App Router requires them for good UX and error isolation).

### Redux scaffolding
`getAdminData` thunk (`src/stores/reducers/admin/adminSlice.ts`) is defined but never dispatched anywhere. The `admin` and `auth` slices have no real consumers. Do not build on top of them without first wiring them up.

### control-vms/overall — reference implementation (fully refactored 2026-06-23)
The first backend-integrated feature. Canonical template for all future backend work. Key patterns:

**Data fetching**
- **Query key factory** at `features/admin/control-vms/overall/data/queryKeys.ts` (`controlVmsKeys`) — use this pattern for every new backend-integrated feature.
- **Co-located hooks** at `features/admin/control-vms/overall/hooks/` — 5 hooks: `useVMSSettingTypes`, `usePostVMSMedia`, `useVMSDepartments`, `useVMSMediaList`, `useContactDetail`. Components are purely declarative; all query/mutation logic lives in hooks.
- **No server data in Redux** — the former `control_vms` Redux slice was deleted. Setting types are shared via the TanStack Query cache.

**Writes**
- **`useMutation` for writes** — submit button binds `loading={isPending} disabled={isPending}` to prevent double-submit.
- **`mutate(body, { onSuccess })` pattern** — do NOT use `mutateAsync` (unhandled rejection risk); use `mutate` with callback so form closes only on success and stays open (retryable) on error.
- **File upload via `FormData`** — `postUploadVMSAPI(form: FormData)` with no manual `Content-Type` header; axios sets the boundary automatically. Use `AxiosError` (not `Error`) for upload catch to surface `error.response?.data?.message`.

**State & modals**
- **Modal state is local** — components own `useState<Data | null>` and pass `open={data !== null}`, `onClose={() => setData(null)}` as props; no modal state in Context.
- **Context inits to `null`** — bureau/bureauState/bureauRoute/bureauSign start as `null`; VMSSection gates rendering on `bureauSign !== null`.
- **Bureau type aliases** live in `src/types/control-vms/bureau.ts`; re-exported from `components/list/BureauList.tsx` for backward compat.

**Media display**
- **Video vs image detection** — use `isVideoUrl(url)` from `overall/data/media.ts` (single source of truth for `VIDEO_EXTENSIONS`). Do NOT re-declare the regex in components.
- **`VMSMedia` component** — `components/sections/vms/VMSMedia.tsx` owns the branch: `variant='thumbnail'` → `<video preload="metadata" muted>` with `#t=0.1` fragment for a static first-frame poster (no autoplay, no decode loop); `variant='player'` → `<video controls autoPlay>` for full playback. Both fall back to antd `<Image>` for non-video URLs.
- **`HLSLivePlayer` is for live HLS CCTV only** — do NOT use it for stored VOD files (.mp4/.avi/.mov). It has no `controls` attribute, calls `play()` unmuted (blocked by browser autoplay policy), and runs reconnect/capture timers indefinitely.
- **Grid card branching** — `ContentSetting` branches by `isVideoUrl`: video → `<figure onClick={onCardClick}><VMSMedia variant='thumbnail'></figure>` (click → `ModalMediaPreview`); image → `<figure><Image></figure>` with no `preview={false}` so antd's built-in lightbox handles the click natively. Do NOT put `onClick` on the image figure.
- **Media preview modal** — `ModalMediaPreview` accepts `open`, `data: VMSMediaList | null`, `onClose`; uses `VMSMedia variant='player'` + `destroyOnHidden` to stop playback on close. Used for **video only** — images use antd Image's own preview.

**Null safety**
- Nested array guards: `(arr ?? []).reduce(...)` / `(arr ?? []).filter(...)` for any backend-sourced tree (mirrors how `BureauList` guards its render).

**Unresolved data-contract questions** — verify with backend: does `GET /vms/settings/departments` return `Solution.vms_id`? (mock only has `solution_id`); and what `res_code` value means POST success?

## Environment Variables

| Variable | Purpose | Note |
|---|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header | Visible to browser — security debt |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL | |
| `TOKEN_SECRET` | iron-session cookie encryption key | Must be set in env — has unsafe fallback in code |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | |
