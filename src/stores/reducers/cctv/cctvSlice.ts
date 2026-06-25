import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CctvState } from '@/types/cctv'
import { getCctvDeptOverviewAPI, getCctvDeptOverviewListAPI, getCctvDeptOverviewTotalsAPI, getCctvDeptCamerasAPI, getCctvRandomOnlineCamerasAPI } from '@/services/routes/CCTVService'
import { CctvDeptOverviewListParams } from '@/types/cctv'

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
  overviewList: null,
  totals: null,
  detailCameras: null,
  randomOnlineCameras: [],
  task_schedules: {
    list: { loading: false, status: 'IDLE' },
    stats: { loading: false, status: 'IDLE' },
    overview: { loading: false, status: 'IDLE' },
    overviewList: { loading: false, status: 'IDLE' },
    totals: { loading: false, status: 'IDLE' },
    detailCameras: { loading: false, status: 'IDLE' },
    randomOnlineCameras: { loading: false, status: 'IDLE' },
  },
}

export const SLICE_NAME = 'cctvSlice'

export const getCctvDeptOverviewData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_DEPT_OVERVIEW', async (deptId: string) => {
  const response = await getCctvDeptOverviewAPI(deptId)
  return response.data
})

export const getCctvDeptOverviewListData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_DEPT_OVERVIEW_LIST', async (params: CctvDeptOverviewListParams) => {
  const response = await getCctvDeptOverviewListAPI(params)
  return response.data
})

export const getCctvDeptOverviewTotalsData = createAsyncThunk(SLICE_NAME + '/API_GET_CCTV_DEPT_OVERVIEW_TOTALS', async (deptId: string) => {
  const response = await getCctvDeptOverviewTotalsAPI(deptId)
  return response.data
})

export const getCctvDeptCamerasData = createAsyncThunk(
  SLICE_NAME + '/API_GET_CCTV_DEPT_CAMERAS',
  async ({ deptId, solutionId }: { deptId: string; solutionId: string }) => {
    const response = await getCctvDeptCamerasAPI(deptId, solutionId)
    return response.data
  }
)

export const getCctvRandomOnlineCamerasData = createAsyncThunk(
  SLICE_NAME + '/API_GET_CCTV_RANDOM_ONLINE_CAMERAS',
  async ({ deptId, limit }: { deptId: string; limit: number }) => {
    const response = await getCctvRandomOnlineCamerasAPI(deptId, limit)
    return response.data
  }
)

const cctvSlice = createSlice({
  name: `${SLICE_NAME}/cctv`,
  initialState,
  reducers: {
    resetDetailCameras: (state) => {
      state.detailCameras = initialState.detailCameras
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(getCctvDeptOverviewListData.fulfilled, (state, action) => {
        state.overviewList = action.payload
        state.task_schedules.overviewList.loading = false
        state.task_schedules.overviewList.status = 'SUCCESS'
      })
      .addCase(getCctvDeptOverviewListData.pending, (state) => {
        state.task_schedules.overviewList.loading = true
        state.task_schedules.overviewList.status = 'LOADING'
      })
      .addCase(getCctvDeptOverviewListData.rejected, (state) => {
        state.task_schedules.overviewList.loading = false
        state.task_schedules.overviewList.status = 'FAILED'
      })
      .addCase(getCctvDeptOverviewTotalsData.fulfilled, (state, action) => {
        state.totals = action.payload
        state.task_schedules.totals.loading = false
        state.task_schedules.totals.status = 'SUCCESS'
      })
      .addCase(getCctvDeptOverviewTotalsData.pending, (state) => {
        state.task_schedules.totals.loading = true
        state.task_schedules.totals.status = 'LOADING'
      })
      .addCase(getCctvDeptOverviewTotalsData.rejected, (state) => {
        state.task_schedules.totals.loading = false
        state.task_schedules.totals.status = 'FAILED'
      })
      .addCase(getCctvDeptCamerasData.fulfilled, (state, action) => {
        state.detailCameras = action.payload
        state.task_schedules.detailCameras.loading = false
        state.task_schedules.detailCameras.status = 'SUCCESS'
      })
      .addCase(getCctvDeptCamerasData.pending, (state) => {
        state.task_schedules.detailCameras.loading = true
        state.task_schedules.detailCameras.status = 'LOADING'
      })
      .addCase(getCctvDeptCamerasData.rejected, (state) => {
        state.task_schedules.detailCameras.loading = false
        state.task_schedules.detailCameras.status = 'FAILED'
      })
      .addCase(getCctvRandomOnlineCamerasData.fulfilled, (state, action) => {
        state.randomOnlineCameras = action.payload.data
        state.task_schedules.randomOnlineCameras.loading = false
        state.task_schedules.randomOnlineCameras.status = 'SUCCESS'
      })
      .addCase(getCctvRandomOnlineCamerasData.pending, (state) => {
        state.task_schedules.randomOnlineCameras.loading = true
        state.task_schedules.randomOnlineCameras.status = 'LOADING'
      })
      .addCase(getCctvRandomOnlineCamerasData.rejected, (state) => {
        state.task_schedules.randomOnlineCameras.loading = false
        state.task_schedules.randomOnlineCameras.status = 'FAILED'
      })
  },
})

export const { resetDetailCameras } = cctvSlice.actions

export default cctvSlice.reducer
