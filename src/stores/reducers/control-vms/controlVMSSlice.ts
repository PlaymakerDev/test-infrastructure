import { createSlice } from '@reduxjs/toolkit'
import { ControlVMSState } from '@/types/control-vms/vms-redux';

const initialState: ControlVMSState = {
  media: {
    search: {}
  },
  media_type: []
}

export const SLICE_NAME = 'controlVMSSlice';

const controlVMSSlice = createSlice({
  name: `${SLICE_NAME}/vmsOverview`,
  initialState,
  reducers: {
    setSearchVMSMedia: (state, action) => {
      state.media.search = action.payload
    },
    resetSearchVMSMedia: (state) => {
      state.media.search = initialState.media.search
    },
    setVMSMediaType: (state, action) => {
      state.media_type = action.payload
    },
    resetVMSMediaType: (state) => {
      state.media_type = initialState.media_type
    },
  },
  extraReducers: () => {
  }
})

export const {
  setSearchVMSMedia,
  resetSearchVMSMedia,
  setVMSMediaType,
  resetVMSMediaType
} = controlVMSSlice.actions

export default controlVMSSlice.reducer
