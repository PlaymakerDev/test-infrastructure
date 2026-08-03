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
// Moved to `./globalStore` (holder-only module, no runtime imports) — keeping
// it here let BaseService's import close a circular chain through the
// reducers and crash module init (see globalStore.ts). Re-exported so React
// callers (StoreProvider) can keep importing from '@/stores/store'; non-React
// modules that the reducers reach (BaseService!) must import
// '@/stores/globalStore' directly instead.
export { getGlobalStore, setGlobalStore } from './globalStore'