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