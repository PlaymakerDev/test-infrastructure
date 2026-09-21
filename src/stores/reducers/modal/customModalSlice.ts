import { createSlice } from '@reduxjs/toolkit'
import { APIResponseGeneralUser } from '@/types/manage/general-user-api';
import { RoadData } from '@/types/manage/road-api';
import { ProjectListData } from '@/types/manage/project-api';
import { ContractorData } from '@/types/manage/contractor-api';
import { APIResponseCameraCrossingCode, APIResponseSolutionByID, APIResponseSolutionCameraList, SolutionList, SolutionLocation } from '@/types/manage/project-detail-api';
import type { APIResponseCamera } from '@/types/manage/solution-api';

export interface CustomModalState {
  user_modal: UserModalState
  road_modal: RoadModalState
  project_modal: ProjectModalState
  contact_modal: ContactModalState
  crossing_code_modal: CrossingCodeModalState
  create_device_modal: CreateDeviceModalState
  confirm_delete_solution_modal: ConfirmDeleteSolutionModalState
  view_device_modal: ViewDeviceModalState
  equipment_modal: EquipmentModalState
  live_stream_modal: LiveStreamModalState
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

export interface CrossingCodeModalState {
  open: boolean
  data?: APIResponseCameraCrossingCode | null
  item?: SolutionLocation | null
  record?: SolutionList | null
  type?: 'VIEW'
}

export interface CreateDeviceModalState {
  open: boolean
  data?: APIResponseSolutionByID | null
  record?: SolutionList | null
  item?: SolutionLocation | null
  type?: 'CREATE' | 'UPDATE' | 'EDIT_SOLUTION_NAME' | 'CREATE_CAMERA'
}

export interface ViewDeviceModalState {
  open: boolean
  data?: APIResponseSolutionCameraList | null
  type?: 'CCTV' | 'DEVICE'
}

/** "รายการอุปกรณ์" modals, opened from TableSolution. `type` picks which one
 *  shows (each modal renders only for its own type); `record` is the solution
 *  (task type) being managed, `item` its install point. Only ids/rows travel
 *  here — the camera list itself is read live by each modal via
 *  useSolutionCameras so it refreshes after add / delete / attach. `solutions`
 *  is every solution at the point (to tell whether `record` is the sole one of
 *  its kind when pre-ticking attached cameras). */
export interface EquipmentModalState {
  open: boolean
  type?: 'CCTV_LIST' | 'CAMERA_SELECT' | 'TRAFFIC_SIGNAL' | 'VMS'
  item?: SolutionLocation | null
  record?: SolutionList | null
  solutions?: SolutionList[] | null
}

/** Live-stream viewer, opened from any of the equipment modals. */
export interface LiveStreamModalState {
  open: boolean
  data?: APIResponseCamera | null
  item?: SolutionLocation | null
}

export interface ConfirmDeleteSolutionModalState {
  open: boolean
  type?: 'DELETE_SOLUTION' | 'DELETE_SOLUTION_TYPE'
  data?: SolutionList[] | null
  item?: SolutionLocation | null
  record?: SolutionList | null
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
  crossing_code_modal: {
    open: false,
  },
  create_device_modal: {
    open: false,
  },
  confirm_delete_solution_modal: {
    open: false
  },
  view_device_modal: {
    open: false,
  },
  equipment_modal: {
    open: false,
  },
  live_stream_modal: {
    open: false,
  }
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
    setCrossingCodeModalOpen: (state, action) => {
      state.crossing_code_modal = action.payload;
    },
    resetCrossingCodeModalData: (state) => {
      state.crossing_code_modal = initialState.crossing_code_modal;
    },
    setCreateDeviceModalOpen: (state, action) => {
      state.create_device_modal = action.payload;
    },
    resetCreateDeviceModalData: (state) => {
      state.create_device_modal = initialState.create_device_modal;
    },
    setConfirmDeleteSolutionModalOpen: (state, action) => {
      state.confirm_delete_solution_modal = action.payload;
    },
    resetConfirmDeleteSolutionModalData: (state) => {
      state.confirm_delete_solution_modal = initialState.confirm_delete_solution_modal;
    },
    setViewDeviceModalOpen: (state, action) => {
      state.view_device_modal = action.payload;
    },
    resetViewDeviceModalData: (state) => {
      state.view_device_modal = initialState.view_device_modal;
    },
    setEquipmentModalOpen: (state, action) => {
      state.equipment_modal = action.payload;
    },
    resetEquipmentModalData: (state) => {
      state.equipment_modal = initialState.equipment_modal;
    },
    setLiveStreamModalOpen: (state, action) => {
      state.live_stream_modal = action.payload;
    },
    resetLiveStreamModalData: (state) => {
      state.live_stream_modal = initialState.live_stream_modal;
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
  setCrossingCodeModalOpen,
  resetCrossingCodeModalData,
  setCreateDeviceModalOpen,
  resetCreateDeviceModalData,
  setConfirmDeleteSolutionModalOpen,
  resetConfirmDeleteSolutionModalData,
  setViewDeviceModalOpen,
  resetViewDeviceModalData,
  setEquipmentModalOpen,
  resetEquipmentModalData,
  setLiveStreamModalOpen,
  resetLiveStreamModalData,
} = customModalSlice.actions

export default customModalSlice.reducer
