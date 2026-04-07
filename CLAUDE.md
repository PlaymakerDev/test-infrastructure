# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # Run ESLint

# Testing (Storybook + Vitest)
npm run storybook        # Start Storybook on port 6006
npm run build-storybook  # Build Storybook
npx vitest               # Run Storybook-based component tests (Playwright/Chromium)

# Run a single test file
npx vitest src/components/video/HLSLivePlayer.stories.tsx
```

## Architecture Overview

This is a **Next.js 16 App Router** frontend for a road/traffic incident management system (DRR-ITS) — a role-based admin dashboard.

### Key Libraries
- **UI**: Ant Design v6 (requires `AntdRegistry` in root layout for SSR compatibility)
- **State**: Redux Toolkit with typed hooks in `src/stores/hooks.ts`
- **Forms**: React Hook Form with Ant Design controllers
- **Auth**: `better-auth` + `iron-session` (httpOnly cookie named `DRR_ITS`, 30-day expiry)
- **HTTP**: Axios with session-aware interceptors in `src/services/BaseService.ts`
- **Video**: HLS.js for live CCTV stream playback
- **Styling**: Tailwind CSS v4

### Route Group Structure

```
src/app/
  (auth)/login/        # Public - login page
  (admin)/dashboard/   # Admin role
  (example)/           # Example/dev pages
  api/auth/[...all]/   # API routes: login, logout, refresh, session
```

The root `page.tsx` redirects `/` → `/login` via `next.config.ts`.

### Authentication Flow

1. POST `/api/auth/login` → validates credentials, stores tokens in iron-session cookie
2. All API requests: `BaseService` fetches session from `/api/auth/session` and injects `Authorization: Bearer {token}` + `x-api-key` headers
3. `src/proxy.ts` (middleware) guards routes: unauthenticated non-login routes → redirect to `/`; authenticated users on `/login` → redirect to their role's first menu path
4. Token refresh: response interceptor in `BaseService` handles `res_code: 40199` (expired) by showing a modal and calling `/api/auth/refresh`; `40100` (invalid) forces logout

### Feature Module Pattern

Each feature lives in `src/features/<role>/<feature>/` with:
- `context/index.tsx` — React context provider (wrap the page layout)
- `screen/index.tsx` — Main screen component (used in `page.tsx`)

Page files in `src/app/` are thin: they import the screen and wrap it with the context provider.

### Redux Pattern

- Slices in `src/stores/reducers/<domain>/`
- Async thunks call services and update `task_schedules` (loading/status per operation)
- Always use typed hooks: `useAppDispatch`, `useAppSelector`, `useAppStore` from `src/stores/hooks.ts`
- Root reducer assembled in `src/stores/reducers/index.ts`

### Services Layer

- `BaseService.ts` — Axios instance (base URL: `NEXT_PUBLIC_HOST_BACKEND`, timeout: 60s) with request/response interceptors
- `ApiService.ts` — Generic typed wrapper: `fetchData<Response, Request>(config)`
- `src/services/routes/` — One file per domain (`AdminService.ts`, `ExampleService.ts`, etc.)

### Navigation / Menu Config

Role menus are defined in `src/configs/menu/` (`admin.ts`, `manager.ts`, `user.ts`). Each entry has a `path`, `label`, and icon key. The middleware uses the first item's path to determine post-login redirect. Icons are resolved in `Navbar.tsx` via an `ICON_LIST` map from `react-icons`.

### HLSLivePlayer Component

`src/components/video/HLSLivePlayer.tsx` is a complex HLS streaming component with:
- Automatic HLS vs direct video detection (`.m3u8` URL → HLS.js)
- Exponential backoff retry with configurable `maxRetries` and `retryDelay`
- Intersection Observer to pause off-screen streams (performance)
- Canvas-based last-frame capture during reconnection
- `useImperativeHandle` exposing `retry()`, `getStatus()`, `isConnected()`

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_HOST_BACKEND` | Backend API base URL |
| `SESSION_SECRET` | iron-session encryption secret |
| `NEXT_PUBLIC_API_KEY` | Value for `x-api-key` request header |

### Testing Approach

Tests are Storybook stories executed via Vitest + Playwright (Chromium, headless). Story files live alongside components as `*.stories.tsx`. There are no separate unit test files currently — add tests as stories in `src/stories/` or co-located `*.stories.tsx`.
