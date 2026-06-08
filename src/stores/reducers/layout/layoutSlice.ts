import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { LayoutState } from '@/types/layout';
import { getSidebarAPI } from '@/services/routes/LayoutService';

const initialState: LayoutState = {
  task_schedules: {
    loading: false,
    status: "IDLE"
  },
  drawer: {
    open: false
  },
  sidebar: []
}

export const SLICE_NAME = 'layoutSlice';

// API
export const getSidebarData = createAsyncThunk(SLICE_NAME + '/apiGetSidebarData', async () => {
  const response = await getSidebarAPI()
  return response.data
})

const layoutSlice = createSlice({
  name: `${SLICE_NAME}/layout`,
  initialState,
  reducers: {
    setTaskSchedule: (state, action) => {
      state.task_schedules.loading = action.payload.loading
      state.task_schedules.status = action.payload.status
    },
    resetTaskSchedule: (state) => {
      state.task_schedules.loading = initialState.task_schedules.loading
      state.task_schedules.status = initialState.task_schedules.status
    },
    setDrawerOpen: (state, action) => {
      state.drawer.open = action.payload.open
    },
    resetDrawerOpen: (state) => {
      state.drawer.open = initialState.drawer.open
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSidebarData.fulfilled, (state, action) => {
        state.sidebar = action.payload
        state.task_schedules.loading = false
        state.task_schedules.status = "SUCCESS"
      })
      .addCase(getSidebarData.pending, (state) => {
        state.task_schedules.loading = true
        state.task_schedules.status = "LOADING"
      })
      .addCase(getSidebarData.rejected, (state) => {
        state.task_schedules.loading = false
        state.task_schedules.status = "FAILED"
      })
  }
})

export const {
  setTaskSchedule,
  resetTaskSchedule,
  setDrawerOpen,
  resetDrawerOpen
} = layoutSlice.actions

export default layoutSlice.reducer
