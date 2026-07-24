import auth from './auth/authSlice'
import example from './example/exampleSlice'
import layout from './layout/layoutSlice'
import vmsOverview from './vms/vmsOverviewSlice'

const rootReducer = {
  auth,
  example,
  layout,
  vms_overview: vmsOverview,
}

export default rootReducer
