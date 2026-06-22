import example from './example/exampleSlice'
import admin from './admin/adminSlice'
import auth from './auth/authSlice'
import layout from './layout/layoutSlice'
import vmsOverview from './vms/vmsOverviewSlice'
import controlVMS from './control-vms/controlVMSSlice'
import cctv from './cctv/cctvSlice'

const rootReducer = {
  example,
  admin,
  auth,
  layout,
  vms_overview: vmsOverview,
  cctv,
  control_vms: controlVMS,
}

export default rootReducer
