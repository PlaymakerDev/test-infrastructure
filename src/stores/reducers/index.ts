import example from './example/exampleSlice'
import layout from './layout/layoutSlice'
import vmsOverview from './vms/vmsOverviewSlice'
import cctv from './cctv/cctvSlice'

const rootReducer = {
  example,
  layout,
  vms_overview: vmsOverview,
  cctv,
}

export default rootReducer
