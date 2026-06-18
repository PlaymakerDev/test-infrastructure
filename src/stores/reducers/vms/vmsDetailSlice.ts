import { createSlice } from '@reduxjs/toolkit'
import { VMSDetailState } from '@/types/vms/detail-redux';

const initialState: VMSDetailState = {
}

export const SLICE_NAME = 'vmsDetailSlice';


const vmsDetailSlice = createSlice({
  name: `${SLICE_NAME}/vmsDetail`,
  initialState,
  reducers: {},
})

export const { } = vmsDetailSlice.actions

export default vmsDetailSlice.reducer
