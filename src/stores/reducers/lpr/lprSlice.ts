import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface LPRState {
  /** One-shot hand-off from the LPR detail page to the overall page's plate
   *  search ("ดูประวัติการเดินทาง"). Lives here instead of the URL so the plate
   *  number never reaches the address bar, history entries or server access
   *  logs. The overall page reads it once at mount and resets it. */
  license_search: {
    q: string
  }
}

const initialState: LPRState = {
  license_search: {
    q: '',
  },
}

const lprSlice = createSlice({
  name: 'lprSlice/lpr',
  initialState,
  reducers: {
    setLPRLicenseSearch: (state, action: PayloadAction<string>) => {
      state.license_search.q = action.payload
    },
    resetLPRLicenseSearch: (state) => {
      state.license_search = initialState.license_search
    },
  },
})

export const {
  setLPRLicenseSearch,
  resetLPRLicenseSearch,
} = lprSlice.actions

export default lprSlice.reducer
