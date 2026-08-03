// ---- Global store accessor (holder-only module) ----
// `makeStore()` is instantiated per-mount inside `StoreProvider` (no
// module-level singleton, so React Strict Mode / multiple mounts stay
// isolated). Non-React modules (BaseService's axios interceptors) need to
// dispatch auth actions whenever the token changes server-side —
// `StoreProvider` registers the live instance here right after creating it.
// Mirrors the `getGlobalModal()/setGlobalModal()` pattern in
// `useTimeoutModal.ts`.
//
// This holder MUST live in its own file with no runtime imports: when it sat
// inside `store.ts`, BaseService's `import { getGlobalStore } from
// '@/stores/store'` closed a circular chain (store → reducers → layoutSlice
// → LayoutService → ApiService → BaseService → store) and crashed every page
// with "Cannot access '{default export}' before initialization"
// (regression from 605a7af, found 2026-07-27). The `AppStore` import below is
// type-only — erased at compile time, so no cycle.
import type { AppStore } from './store'

let _store: AppStore | null = null

export const setGlobalStore = (store: AppStore) => {
  _store = store
}

export const getGlobalStore = (): AppStore | null => _store
