import { combineReducers, configureStore } from '@reduxjs/toolkit'
// IMPORT ROOT REDUCER
import rootReducer from './reducers'

const reducer = combineReducers(rootReducer)

export const makeStore = () => {
  return configureStore({
    reducer
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

// ---- Global store accessor ----
// `makeStore()` is instantiated per-mount inside `StoreProvider` (no module-level
// singleton store, so React Strict Mode / multiple mounts stay isolated). Some
// non-React modules (BaseService's axios interceptors) need to dispatch auth
// actions whenever the token changes server-side — `StoreProvider` registers the
// live instance here right after creating it. Mirrors the existing
// `getGlobalModal()/setGlobalModal()` pattern in `useTimeoutModal.ts`.
let _store: AppStore | null = null

export const setGlobalStore = (store: AppStore) => {
  _store = store
}

export const getGlobalStore = (): AppStore | null => _store