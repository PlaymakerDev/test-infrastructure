import { getAdminAPI } from '@/services/routes/AdminService';
import { AdminState } from '@/types/admin';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const initialState: AdminState = {
  me: {
    user_id: ""
  },
  task_schedules: {
    me: {
      loading: false,
      status: 'IDLE'
    }
  }
}

export const SLICE_NAME = 'adminSlice';

export const getAdminData = createAsyncThunk(SLICE_NAME + '/API_GET_ADMIN', async () => {
  const response = await getAdminAPI()
  return response.data
})

const adminSlice = createSlice({
  name: `${SLICE_NAME}/admin`,
  initialState,
  reducers: {
    setMe: (state, action) => {
      state.me = action.payload
    },
    resetMe: (state) => {
      state.me = initialState.me
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminData.fulfilled, (state, action) => {
        state.me = action.payload
        state.task_schedules.me.loading = false
        state.task_schedules.me.status = 'SUCCESS'
      })
      .addCase(getAdminData.pending, (state) => {
        state.task_schedules.me.loading = true
        state.task_schedules.me.status = 'LOADING'
      })
      .addCase(getAdminData.rejected, (state) => {
        state.task_schedules.me.loading = false
        state.task_schedules.me.status = 'FAILED'
      })
  }
})

export const {
  setMe,
  resetMe
} = adminSlice.actions

export default adminSlice.reducer
