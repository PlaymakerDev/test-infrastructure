import example from './example/exampleSlice'
import admin from './admin/adminSlice'
import auth from './auth/authSlice'
import layout from './layout/layoutSlice'

const rootReducer = {
  example,
  admin,
  auth,
  layout
}

export default rootReducer
