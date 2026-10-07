import auth from './auth/authSlice'
import example from './example/exampleSlice'
import layout from './layout/layoutSlice'
import vmsOverview from './vms/vmsOverviewSlice'
import customModal from './modal/customModalSlice'
import lpr from './lpr/lprSlice'

const rootReducer = {
  auth,
  example,
  layout,
  vms_overview: vmsOverview,
  custom_modal: customModal,
  lpr,
}

export default rootReducer
