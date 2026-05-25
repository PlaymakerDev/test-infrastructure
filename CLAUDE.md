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

There are no separate unit test commands — testing is Storybook-centric via Vitest + Playwright.

## Architecture

### Page → Screen → Component pattern

Pages (`src/app/`) are thin wrappers that import and render a Screen component:

```
src/app/admin/dashboard/page.tsx
  → src/features/admin/dashboard/screen/index.tsx   (logic + layout)
    → src/features/admin/dashboard/components/       (UI pieces)
```

All business logic lives in `screen/index.tsx` or a `context/` directory alongside it. Pages never contain logic.

### Directory Map

```
src/
├── app/             # Next.js App Router — pages and API routes only
├── features/        # Feature modules (admin, auth, example)
├── components/      # Shared UI (chart, layout, map, video, list)
├── stores/          # Redux store, slices, typed hooks
├── services/        # API layer (BaseService, ApiService, route services)
├── configs/         # Ant Design theme, menu config
├── types/           # Shared TypeScript types
├── utils/           # Utility functions and custom hooks
├── lib/             # iron-session config
├── mock/            # Mock data for development
└── styles/          # Global CSS
```

### API Layer

All HTTP calls go through `src/services/BaseService.ts` (Axios instance), which:
- Injects `Authorization: Bearer <token>` and `x-api-key` on every request
- On `40199` (token expired): shows a modal asking the user to refresh, then retries the original request
- On `40100` or `401`: auto-logs the user out

`src/services/ApiService.ts` wraps BaseService with a generic Promise interface. Feature-specific services live in `src/services/routes/` (e.g., `AdminService.ts`).

Backend base URL is set via `NEXT_PUBLIC_HOST_BACKEND` in `.env`.

### Authentication

- Server-side session: iron-session cookies configured in `src/lib/defaultSession.ts`
- API routes: `src/app/api/auth/[...all]/route.ts` handles login, logout, and token refresh
- Client hook: `src/utils/hooks/useGetSession.ts` reads the session
- Token expiry modal: `src/utils/hooks/useTimeoutModal.ts`

### State Management

Redux Toolkit via `src/stores/`. Always use the typed helpers:
- `useAppDispatch`, `useAppSelector`, `useAppStore` from `src/stores/hooks.ts`

Reducers: `auth`, `admin`, `example`, `layout`.

### Import Alias

`@/*` maps to `src/*`. Always use `@/` imports, never relative paths crossing feature boundaries.

## UI Conventions

- **Component library**: Ant Design 6 with a custom dark theme — primary color `#FCD116` (yellow). Theme config is in `src/configs/antd/themeConfig.ts`.
- **Styling**: Tailwind CSS 4. Prefer Tailwind utility classes; use `src/styles/` for global overrides only.
- **Font**: IBM Plex Sans Thai (loaded globally).
- **Charts**: ECharts via `src/components/chart/` wrappers. Use existing wrappers before reaching for ECharts directly.
- **Maps**: Mapbox GL via `src/components/map/`.
- **Video**: HLS live streams via `src/components/video/`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_KEY` | API key sent as `x-api-key` header |
| `NEXT_PUBLIC_HOST_BACKEND` | Backend base URL |
| `TOKEN_SECRET` | iron-session cookie secret |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token |
