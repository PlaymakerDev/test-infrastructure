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
- Fetches `access_token` from `/api/auth/session` on **every request** (known latency issue — do not add more inline `fetch()` calls in components)
- Injects `Authorization: Bearer <token>` and `x-api-key` on every request
- On `40199` (token expired): shows a modal asking the user to refresh, then retries the original request
- On `40100` or `401`: auto-logs the user out

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

All feature data is currently **mock/static** — hardcoded in `src/features/**/data/*.ts` files or inline in components. The only real backend call is `GET /auth/me` via `src/services/routes/AdminService.ts`.

When connecting a feature to the real backend:
1. Add a typed service function to `src/services/routes/<Feature>Service.ts` using `ApiService.fetchData<ResponseType>()`
2. Use `createAsyncThunk` or RTK Query endpoint (after fixing `RtkQueryService.ts`) — do NOT fetch directly in `screen/index.tsx`
3. Define the API response type in `src/types/<feature>.ts`

Do not add `fetch()` calls inside React components or screens directly.

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
- **`src/services/RtkQueryService.ts:19`** — `axiosBaseQuery` does `const response = BaseService(request)` without `await` inside `try`, so the `catch` block can never run. Fix: add `await` before using.
- **`src/services/BaseService.ts` token-expiry handler (`40199`, lines 50–78) — request can hang forever.** The branch returns `new Promise((resolve, reject) => getGlobalModal()?.confirm({...}))`. `getGlobalModal()` (`src/utils/hooks/useTimeoutModal.ts`) is `null` during the init window before `ModalRegistrar`'s `useEffect` runs (`src/components/provider/AntdAppProvider.tsx`), so the optional chain short-circuits and **neither `resolve` nor `reject` is ever called** — the awaiting request never settles. Any fix MUST settle the promise even when the modal is null. Related: there is no single-flight refresh lock, so concurrent `40199`/`401` failures each open a modal and each fire `/api/auth/refresh` (modals stack, refreshes race). A designed (not yet implemented) fix — session-fetch promise-cache + single-flight refresh + silent auto-refresh + null-modal fallback — is captured in memory (`baseservice-refactor-plan`). An untracked reference candidate exists at `test/BaseService.ts` (right mechanisms, but imports a nonexistent `AuthService`, uninstalled `sweetalert2`, static antd `Modal`, and `/login` — do NOT drop it in verbatim; adapt only the mechanisms).

### Logging in production path
- **`src/services/BaseService.ts:28`** — `console.log("[REQ]", ...)` fires on every API request. Remove before going to production.
- `src/app/api/auth/[...all]/route.ts:84` — `console.log("===", error)` leaks error details server-side.

### Missing route boundaries
No `error.tsx`, `loading.tsx`, or `not-found.tsx` exist anywhere in the app. Add these per-route when implementing a feature properly (App Router requires them for good UX and error isolation).

### Redux scaffolding
`getAdminData` thunk (`src/stores/reducers/admin/adminSlice.ts`) is defined but never dispatched anywhere. The `admin` and `auth` slices have no real consumers. Do not build on top of them without first wiring them up.

## Environment Variables

| Variable | Purpose | Note |
|---|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header | Visible to browser — security debt |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL | |
| `TOKEN_SECRET` | iron-session cookie encryption key | Must be set in env — has unsafe fallback in code |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | |
