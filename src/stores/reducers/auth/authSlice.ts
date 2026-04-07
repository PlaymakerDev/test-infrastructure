import { AuthState } from '@/types/auth';
import { createSlice } from '@reduxjs/toolkit'

const initialState: AuthState = {
  auth_token: {
    access_token: null,
    refresh_token: null,
  },
}

export const SLICE_NAME = 'authSlice';

const authSlice = createSlice({
  name: `${SLICE_NAME}/auth`,
  initialState,
  reducers: {
    setAuthToken: (state, action) => {
      state.auth_token.access_token = action.payload.access_token
      state.auth_token.refresh_token = action.payload.refresh_token
    },
    resetAuthToken: (state) => {
      state.auth_token.access_token = initialState.auth_token.access_token
      state.auth_token.refresh_token = initialState.auth_token.refresh_token
    }
  }
})

export const {
  setAuthToken,
  resetAuthToken
} = authSlice.actions

export default authSlice.reducer
