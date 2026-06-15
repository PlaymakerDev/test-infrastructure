import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getVMSOverviewAPI, getVMSOverviewListAPI, getVMSOverviewRandomOnlineAPI, getVMSOverviewTotalAPI } from '@/services/routes/VMSService';
import { VMSOverviewState } from '@/types/vms/overview-redux';
import { APIRequestVMSList, APIRequestVMSRandomOnline } from '@/types/vms/overview-api';

const initialState: VMSOverviewState = {
  vms_overview: {
    centroid: [0, 0],
    locations: []
  },
  vms_random_online: [],
  vms_total: {
    solution: {
      total: 0,
      online: 0,
      offline: 0
    },
    warranty: {
      active: 0,
      expired: 0
    }
  },
  vms_list: {
    search: {
      page: 1,
      limit: 10
    },
    data: {
      res_data: [],
      meta_data: {
        count: 0,
        page: 1,
        limit: 10,
        total_pages: 0
      }
    }
  },
  task_schedules: {
    vms_overview: {
      loading: false,
      status: 'IDLE'
    },
    vms_random_online: {
      loading: false,
      status: 'IDLE'
    },
    vms_total: {
      loading: false,
      status: 'IDLE'
    },
    vms_list: {
      loading: false,
      status: 'IDLE'
    }
  }
}

export const SLICE_NAME = 'vmsOverviewSlice';

// API
export const getVMSOverviewData = createAsyncThunk(SLICE_NAME + '/apiGetVMSOverview', async (deptId: string | number) => {
  const response = await getVMSOverviewAPI(deptId)
  return response.data
})

export const getVMSOverviewRandomOnlineData = createAsyncThunk(SLICE_NAME + '/apiGetVMSOverviewRandomOnline', async (params: { deptId: string | number, requestParams: APIRequestVMSRandomOnline }) => {
  const response = await getVMSOverviewRandomOnlineAPI(params.deptId, params.requestParams)
  return response.data
})

export const getVMSOverviewTotalData = createAsyncThunk(SLICE_NAME + '/apiGetVMSOverviewTotal', async (deptId: string | number) => {
  const response = await getVMSOverviewTotalAPI(deptId)
  return response.data
})

export const getVMSOverviewListData = createAsyncThunk(SLICE_NAME + '/apiGetVMSOverviewList', async (params: { deptId: string | number, requestParams: APIRequestVMSList }) => {
  const response = await getVMSOverviewListAPI(params.deptId, params.requestParams)
  return response.data
})


const vmsOverviewSlice = createSlice({
  name: `${SLICE_NAME}/vmsOverview`,
  initialState,
  reducers: {
    setSearchVMSList: (state, action) => {
      state.vms_list.search = action.payload
    },
    resetSearchVMSList: (state) => {
      state.vms_list.search = initialState.vms_list.search
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(getVMSOverviewData.fulfilled, (state, action) => {
        state.vms_overview = action.payload
        state.task_schedules.vms_overview.loading = false
        state.task_schedules.vms_overview.status = "SUCCESS"
      })
      .addCase(getVMSOverviewData.pending, (state) => {
        state.task_schedules.vms_overview.loading = true
        state.task_schedules.vms_overview.status = "LOADING"
      })
      .addCase(getVMSOverviewData.rejected, (state) => {
        state.task_schedules.vms_overview.loading = false
        state.task_schedules.vms_overview.status = "FAILED"
      })
      // Random Online
      .addCase(getVMSOverviewRandomOnlineData.fulfilled, (state, action) => {
        state.vms_random_online = action.payload
        state.task_schedules.vms_random_online.loading = false
        state.task_schedules.vms_random_online.status = "SUCCESS"
      })
      .addCase(getVMSOverviewRandomOnlineData.pending, (state) => {
        state.task_schedules.vms_random_online.loading = true
        state.task_schedules.vms_random_online.status = "LOADING"
      })
      .addCase(getVMSOverviewRandomOnlineData.rejected, (state) => {
        state.task_schedules.vms_random_online.loading = false
        state.task_schedules.vms_random_online.status = "FAILED"
      })
      // Total
      .addCase(getVMSOverviewTotalData.fulfilled, (state, action) => {
        state.vms_total = action.payload
        state.task_schedules.vms_total.loading = false
        state.task_schedules.vms_total.status = "SUCCESS"
      })
      .addCase(getVMSOverviewTotalData.pending, (state) => {
        state.task_schedules.vms_total.loading = true
        state.task_schedules.vms_total.status = "LOADING"
      })
      .addCase(getVMSOverviewTotalData.rejected, (state) => {
        state.task_schedules.vms_total.loading = false
        state.task_schedules.vms_total.status = "FAILED"
      })
      // List
      .addCase(getVMSOverviewListData.fulfilled, (state, action) => {
        state.vms_list.data = action.payload
        state.task_schedules.vms_list.loading = false
        state.task_schedules.vms_list.status = "SUCCESS"
      })
      .addCase(getVMSOverviewListData.pending, (state) => {
        state.task_schedules.vms_list.loading = true
        state.task_schedules.vms_list.status = "LOADING"
      })
      .addCase(getVMSOverviewListData.rejected, (state) => {
        state.task_schedules.vms_list.loading = false
        state.task_schedules.vms_list.status = "FAILED"
      })
  }
})

export const {
  resetSearchVMSList,
  setSearchVMSList,
} = vmsOverviewSlice.actions

export default vmsOverviewSlice.reducer
