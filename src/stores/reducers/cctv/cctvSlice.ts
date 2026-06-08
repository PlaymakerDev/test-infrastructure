import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CctvState } from '@/types/cctv'
import { getCctvListAPI, getCctvStatsAPI, getCctvDeptOverviewAPI } from '@/services/routes/CCTVService'

const initialState: CctvState = {
  list: [],
  stats: {
    total: 0,
    totalActive: 0,
    inWarranty: 0,
    inWarrantyActive: 0,
    expired: 0,
    expiredActive: 0,
  },
  overview: null,
  task_schedules: {
    list: { loading: false, status: 'IDLE' },
    stats: { loading: false, status: 'IDLE' },
    overview: { loading: false, status: 'IDLE' },
  },
}

export const SLICE_NAME = 'cctvSlice'

export const getCctvListData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_LIST', async () => {
  const response = await getCctvListAPI()
  return response.data
})

export const getCctvStatsData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_STATS', async () => {
  const response = await getCctvStatsAPI()
  return response.data
})

export const getCctvDeptOverviewData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_DEPT_OVERVIEW', async (deptId: string) => {
  const response = await getCctvDeptOverviewAPI(deptId)
  return response.data
})

const cctvSlice = createSlice({
  name: `${SLICE_NAME}/cctv`,
  initialState,
  reducers: {
    resetList: (state) => {
      state.list = initialState.list
    },
    resetStats: (state) => {
      state.stats = initialState.stats
    },
    resetOverview: (state) => {
      state.overview = initialState.overview
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCctvListData.fulfilled, (state, action) => {
        state.list = action.payload
        state.task_schedules.list.loading = false
        state.task_schedules.list.status = 'SUCCESS'
      })
      .addCase(getCctvListData.pending, (state) => {
        state.task_schedules.list.loading = true
        state.task_schedules.list.status = 'LOADING'
      })
      .addCase(getCctvListData.rejected, (state) => {
        state.task_schedules.list.loading = false
        state.task_schedules.list.status = 'FAILED'
      })
      .addCase(getCctvStatsData.fulfilled, (state, action) => {
        state.stats = action.payload
        state.task_schedules.stats.loading = false
        state.task_schedules.stats.status = 'SUCCESS'
      })
      .addCase(getCctvStatsData.pending, (state) => {
        state.task_schedules.stats.loading = true
        state.task_schedules.stats.status = 'LOADING'
      })
      .addCase(getCctvStatsData.rejected, (state) => {
        state.task_schedules.stats.loading = false
        state.task_schedules.stats.status = 'FAILED'
      })
      .addCase(getCctvDeptOverviewData.fulfilled, (state, action) => {
        state.overview = action.payload
        state.task_schedules.overview.loading = false
        state.task_schedules.overview.status = 'SUCCESS'
      })
      .addCase(getCctvDeptOverviewData.pending, (state) => {
        state.task_schedules.overview.loading = true
        state.task_schedules.overview.status = 'LOADING'
      })
      .addCase(getCctvDeptOverviewData.rejected, (state) => {
        state.task_schedules.overview.loading = false
        state.task_schedules.overview.status = 'FAILED'
      })
  },
})

export const { resetList, resetStats, resetOverview } = cctvSlice.actions

export default cctvSlice.reducer
