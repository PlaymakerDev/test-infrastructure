import example from './example/exampleSlice'
import admin from './admin/adminSlice'
import auth from './auth/authSlice'
import layout from './layout/layoutSlice'
import cctv from './cctv/cctvSlice'

const rootReducer = {
  example,
  admin,
  auth,
  layout,
  cctv,
}

export default rootReducer
