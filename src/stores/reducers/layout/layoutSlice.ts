import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { LayoutState } from '@/types/layout';
import { getSidebarAPI } from '@/services/routes/LayoutService';

const initialState: LayoutState = {
  loading: false,
  fullscreen_loading: false,
  drawer: {
    open: false
  },
  sidebar: [],
  task_schedules: {
    sidebar: {
      loading: false,
      status: "IDLE"
    }
  },
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
    setLoading: (state, action) => {
      state.loading = action.payload.loading
    },
    setFullscreenLoading: (state, action) => {
      state.fullscreen_loading = action.payload.fullscreen_loading
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
        state.task_schedules.sidebar.loading = false
        state.task_schedules.sidebar.status = "SUCCESS"
      })
      .addCase(getSidebarData.pending, (state) => {
        state.task_schedules.sidebar.loading = true
        state.task_schedules.sidebar.status = "LOADING"
      })
      .addCase(getSidebarData.rejected, (state) => {
        state.task_schedules.sidebar.loading = false
        state.task_schedules.sidebar.status = "FAILED"
      })
  }
})

export const {
  setLoading,
  setFullscreenLoading,
  setDrawerOpen,
  resetDrawerOpen
} = layoutSlice.actions

export default layoutSlice.reducer
