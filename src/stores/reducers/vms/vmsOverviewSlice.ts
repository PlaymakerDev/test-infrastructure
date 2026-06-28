import { createSlice } from '@reduxjs/toolkit'
import { VMSOverviewState } from '@/types/vms/overview-redux';

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
    data: []
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

const vmsOverviewSlice = createSlice({
  name: `${SLICE_NAME}/vmsOverview`,
  initialState,
  reducers: {
    setSearchVMSList: (state, action) => {
      state.vms_list.search = action.payload
    },
    setVMSTotalData: (state, action) => {
      state.vms_total = action.payload
    },
  },
})

export const {
  setSearchVMSList,
  setVMSTotalData,
} = vmsOverviewSlice.actions

export default vmsOverviewSlice.reducer
