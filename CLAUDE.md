# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run storybook    # Storybook dev server
```

No test runner is configured — Vitest/Playwright are listed as dependencies but no test scripts exist in package.json.

## Architecture Overview

Next.js 16 App Router dashboard application for traffic incident management (DRR ITS), written in TypeScript strict mode.

**Stack:** Next.js 16 · React 19 · Redux Toolkit · Ant Design 6 · TailwindCSS 4 · Axios · iron-session · Mapbox GL

### Path alias

`@/*` → `./src/*` (used everywhere; prefer over relative imports)

### Routing

Root (`/`) redirects to `/auth/login` via `next.config.ts`. All middleware logic lives in `src/proxy.ts` (exported as `middleware` — not `src/middleware.ts`):

- Unauthenticated → redirect to `/auth/login`
- Authenticated on `/auth/login` → redirect to first menu item path for user role

App Router groups:
- `src/app/auth/` — login layout (minimal)
- `src/app/admin/` — protected pages, uses `PageLayout` (Navbar + Sidebar)
- `src/app/example/` — development/demo pages

### Feature organization

```
src/features/<domain>/<feature>/
  screen/index.tsx     # Main page component (imported by app/*/page.tsx)
  components/          # Feature-scoped sub-components
  context/             # Feature-scoped providers
```

Page files in `src/app/` are thin shells that just render the feature screen.

### State management (Redux Toolkit)

Store slices: `auth`, `admin`, `example`, `layout`

- `src/stores/store.ts` — store config
- `src/stores/hooks.ts` — typed `useAppDispatch` / `useAppSelector`
- `src/stores/reducers/` — slice files with `createAsyncThunk` + `extraReducers`

Thunks follow the pattern: `pending` sets loading flag, `fulfilled`/`rejected` update state.

The `layout` slice tracks:
- `task_schedules` — global loading/status state shared across features
- `drawer.open` — sidebar drawer visibility

### Auth & sessions

Auth is handled by `iron-session` (HTTP-only encrypted cookies, cookie name: `DRR_ITS`).

Next.js API routes at `src/app/api/auth/[...all]/route.ts`:
- `GET /api/auth/session` — read session tokens
- `POST /api/auth/login` — login, store `access_token` + `refresh_token`
- `POST /api/auth/logout` — destroy session
- `POST /api/auth/refresh` — refresh tokens

Session contains: `{ access_token, refresh_token, role }`. Role is either `"ADMIN"` or `"EXAMPLE"`.

Required env var: `TOKEN_SECRET` (session encryption key).

### API / service layer

```
BaseService (Axios instance, 60s timeout)
  └── ApiService.fetchData<Response, Request>(config) — typed wrapper
        └── src/services/routes/*.ts — domain-specific service calls
```

**Request interceptor:** auto-attaches `Authorization: Bearer {access_token}` and `x-api-key: {NEXT_PUBLIC_API_KEY}` to every request.

**Response interceptor:** handles `res_code === "40199"` (token expired → refresh modal) and `res_code === "40100"` (invalid token → force logout). Status `401` also triggers logout.

Backend base URL: `NEXT_PUBLIC_HOST_BACKEND` (defaults to `https://api-go.enixma.net/api`).

### Map

`src/components/map/ReactMap.tsx` renders a full-screen Mapbox map centered on Thailand (lat 14.0, lng 101.5, zoom 5.2). Token: `NEXT_PUBLIC_MAPBOX_TOKEN`. Uses a custom Mapbox style with brightness filtered to 0.5.

### Menu & role-based navigation

`src/configs/menu/index.ts` exports `menu: Record<Role, MenuItem[]>`. Each item has `key`, `title`, `path`, `path_active`, `path_list`, and an icon name string (Tabler Icons convention, e.g. `"TbLayoutDashboard"`).

The sidebar resolves icon components dynamically from the name string. To add a new menu item, add it to `src/configs/menu/admin.ts` with a valid `@tabler/icons-react` icon name.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_HOST_BACKEND` | Backend API base URL |
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token |
| `TOKEN_SECRET` | iron-session cookie encryption key |

### Key conventions

- Mark components that use hooks, Redux, or browser APIs with `"use client"`.
- Use `React.memo()` for list-rendered or frequently re-rendered components.
- Form state is managed with `react-hook-form` using `Controller` pattern; never uncontrolled inputs.
- Error feedback is modal-based (Ant Design `Modal.error`), not inline.
- The `PromiseProperties` type (loading boolean + status enum) is the standard shape for async state in slices.
