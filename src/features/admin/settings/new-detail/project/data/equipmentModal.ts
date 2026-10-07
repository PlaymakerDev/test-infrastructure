import type { EquipmentModalState } from '@/stores/reducers/modal/customModalSlice'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'

export type EquipmentModalType = NonNullable<EquipmentModalState['type']>

/** LPR's `solution_type.id`. Not in SOLUTION_TYPE (@/types/manage/solution-api),
 *  which stops at 10 — kept local the same way `data/solutionType.ts` keeps
 *  SOLUTION_TYPE_CCTV. */
export const SOLUTION_TYPE_LPR = 11

/** Which "รายการอุปกรณ์" modal manages a solution's equipment, by solution
 *  kind. `null` = no managed picker for that kind (Lighting / Tunnel /
 *  Bridge Lighting have no camera endpoint) — TableSolution does nothing on
 *  click for those.
 *
 *  - CCTV_LIST       CCTV: list + delete + add via POST /cctv/cameras
 *  - TRAFFIC_SIGNAL  Traffic Signal: per-row phase + camera_type picker
 *  - VMS             VMS: desktop-screen URL + camera picker (upsert)
 *  - CAMERA_SELECT   Counting / Analytic / Crosswalk / WIM / LPR: replace-on-write
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
    case SOLUTION_TYPE_LPR:
      return 'CAMERA_SELECT'
    default:
      return null
  }
}
