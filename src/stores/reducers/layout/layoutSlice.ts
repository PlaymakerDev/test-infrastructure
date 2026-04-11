import { createSlice } from '@reduxjs/toolkit'
import { LayoutState } from '@/types/layout';
import { set } from 'better-auth';

const initialState: LayoutState = {
  task_schedules: {
    loading: false,
    status: "IDLE"
  },
  drawer: {
    open: false
  }
}

export const SLICE_NAME = 'layoutSlice';

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
  }
})

export const {
  setTaskSchedule,
  resetTaskSchedule,
  setDrawerOpen,
  resetDrawerOpen
} = layoutSlice.actions

export default layoutSlice.reducer
