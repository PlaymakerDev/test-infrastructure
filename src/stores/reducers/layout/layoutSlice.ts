import { createSlice } from '@reduxjs/toolkit'
import { LayoutState } from '@/types/layout';

const initialState: LayoutState = {
  task_schedules: {
    loading: false,
    status: "IDLE"
  },
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
    }
  }
})

export const {
  setTaskSchedule,
  resetTaskSchedule
} = layoutSlice.actions

export default layoutSlice.reducer
