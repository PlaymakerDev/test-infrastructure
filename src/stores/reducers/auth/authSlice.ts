import { createSlice } from '@reduxjs/toolkit'
import { AuthState } from '@/types/auth';

const initialState: AuthState = {
  auth_token: {
    access_token: null,
    refresh_token: null,
  },
  info: {
    "id": "",
    "username": "",
    "user_type_id": 0,
    "is_active": false,
    "created_at": "",
    "created_by": "",
    "deleted_by": null,
    "general_user": {
      "user_id": "",
      "first_name": "",
      "lastname": "",
      "province_id": 0,
      "department_id": 0,
      "role": "",
      "is_ldap": false,
      "created_at": "",
      "created_by": "",
      "province": {
        "id": 0,
        "name_th": "",
        "name_en": "",
        "region_id": 0,
        "region_name_th": "",
        "region_name_en": "",
        "created_at": "",
        "updated_at": ""
      },
      "department": {
        "id": 0,
        "department_group": 0,
        "province": "",
        "department_office_no": 0,
        "department_name": "",
        "department_short_name": "",
        "is_external": 0,
        "province_id": 0,
        "line_token": "",
        "line_group_token": "",
        "is_urban": 0,
        "department_type": 0,
        "region_id": 0
      }
    },
    "contractor": {
      "user_id": "",
      "company_name": "",
      "short_name": "",
      "address": "",
      "name": "",
      "phone": "",
      "email": "",
      "created_at": "",
      "created_by": ""
    }
  }
}

export const SLICE_NAME = 'authSlice';


const authSlice = createSlice({
  name: `${SLICE_NAME}/auth`,
  initialState,
  reducers: {
    setAuthTokenState: (state, action) => {
      state.auth_token = action.payload
    },
    setAuthInfoState: (state, action) => {
      state.info = action.payload
    },
    resetAuthInfoState: (state) => {
      state.info = initialState.info
    },
    resetAuthTokenState: (state) => {
      state.auth_token = initialState.auth_token
    }
  },
})

export const {
  setAuthTokenState,
  setAuthInfoState,
  resetAuthInfoState,
  resetAuthTokenState
} = authSlice.actions

export default authSlice.reducer
