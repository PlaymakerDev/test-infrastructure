import { createSlice } from '@reduxjs/toolkit'
import { APIResponseGeneralUser } from '@/types/manage/general-user-api';
import { RoadData } from '@/types/manage/road-api';
import { ProjectListData } from '@/types/manage/project-api';
import { ContractorData } from '@/types/manage/contractor-api';

export interface CustomModalState {
  user_modal: UserModalState
  road_modal: RoadModalState
  project_modal: ProjectModalState
  contact_modal: ContactModalState
}

export interface UserModalState {
  open: boolean
  data?: APIResponseGeneralUser | null
  type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPDATE_PASSWORD'
}

export interface RoadModalState {
  open: boolean
  data?: RoadData | null
  type?: 'CREATE' | 'UPDATE' | 'DELETE'
}

export interface ProjectModalState {
  open: boolean
  data?: ProjectListData | null
  type?: 'CREATE' | 'UPDATE' | 'DELETE'
}

export interface ContactModalState {
  open: boolean
  data?: ContractorData | null
  type?: 'CREATE' | 'UPDATE' | 'DELETE'
}

const initialState: CustomModalState = {
  user_modal: {
    open: false,
  },
  road_modal: {
    open: false,
  },
  project_modal: {
    open: false,
  },
  contact_modal: {
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
    setRoadModalOpen: (state, action) => {
      state.road_modal = action.payload;
    },
    resetRoadModalData: (state) => {
      state.road_modal = initialState.road_modal;
    },
    setProjectModalOpen: (state, action) => {
      state.project_modal = action.payload;
    },
    resetProjectModalData: (state) => {
      state.project_modal = initialState.project_modal;
    },
    setContactModalOpen: (state, action) => {
      state.contact_modal = action.payload;
    },
    resetContactModalData: (state) => {
      state.contact_modal = initialState.contact_modal;
    },
  },
})

export const {
  setUserModalOpen,
  resetUserModalData,
  setRoadModalOpen,
  resetRoadModalData,
  setProjectModalOpen,
  resetProjectModalData,
  setContactModalOpen,
  resetContactModalData,
} = customModalSlice.actions

export default customModalSlice.reducer
