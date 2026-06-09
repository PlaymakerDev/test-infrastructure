import example from './example/exampleSlice'
import admin from './admin/adminSlice'
import auth from './auth/authSlice'
import layout from './layout/layoutSlice'
import vmsOverview from './vms/vmsOverviewSlice'

const rootReducer = {
  example,
  admin,
  auth,
  layout,
  vms_overview: vmsOverview
}

export default rootReducer
