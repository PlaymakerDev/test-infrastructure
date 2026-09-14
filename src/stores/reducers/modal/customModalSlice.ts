import { createSlice } from '@reduxjs/toolkit'
import { APIResponseGeneralUser } from '@/types/manage/general-user-api';

export interface CustomModalState {
  user_modal: UserModalState
}

export interface UserModalState {
  open: boolean
  data?: APIResponseGeneralUser | null
  type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPDATE_PASSWORD'
}

const initialState: CustomModalState = {
  user_modal: {
    open: false,
  },
}

export const SLICE_NAME = 'customModalSlice';

const customModalSlice = createSlice({
  name: `${SLICE_NAME}/customModal`,
  initialState,
  reducers: {
    setUserModalOpen: (state, action) => {
      state.user_modal = action.payload;
    },
    resetUserModalData: (state) => {
      state.user_modal = initialState.user_modal;
    },
  },
})

export const {
  setUserModalOpen,
  resetUserModalData,
} = customModalSlice.actions

export default customModalSlice.reducer
