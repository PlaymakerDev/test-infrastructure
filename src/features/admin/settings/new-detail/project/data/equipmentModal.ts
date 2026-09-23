import type { EquipmentModalState } from '@/stores/reducers/modal/customModalSlice'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'

export type EquipmentModalType = NonNullable<EquipmentModalState['type']>

/** Which "รายการอุปกรณ์" modal manages a solution's equipment, by solution
 *  kind. `null` = no managed picker for that kind (Lighting / Tunnel /
 *  Bridge Lighting have no camera endpoint) — TableSolution falls back to the
 *  read-only camera list for those.
 *
 *  - CCTV_LIST       CCTV: list + delete + add via POST /cctv/cameras
 *  - TRAFFIC_SIGNAL  Traffic Signal: per-row phase + camera_type picker
 *  - VMS             VMS: desktop-screen URL + camera picker (upsert)
 *  - CAMERA_SELECT   Counting / Analytic / Crosswalk / WIM: replace-on-write
 *                    picker over /manage/solution/camera/{kind} */
export const getEquipmentModalType = (kindId: number): EquipmentModalType | null => {
  switch (kindId) {
    case SOLUTION_TYPE.CCTV:
      return 'CCTV_LIST'
    case SOLUTION_TYPE.Traffic:
      return 'TRAFFIC_SIGNAL'
    case SOLUTION_TYPE.VMS:
      return 'VMS'
    case SOLUTION_TYPE.Counting:
    case SOLUTION_TYPE.Analytic:
    case SOLUTION_TYPE.Crosswalk:
    case SOLUTION_TYPE.WIM:
      return 'CAMERA_SELECT'
    default:
      return null
  }
}
