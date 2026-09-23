/** tbl_solution_type.id for CCTV.
 *
 *  CCTV is no longer a per-install-point "ประเภทงาน" an operator creates.
 *  One CCTV solution covers a whole (โครงการ + สายทาง) and comes into being
 *  when the first camera is added to that road, so this page:
 *
 *  - hides CCTV from the ประเภทงาน dropdown (FormCreateDevice), and
 *  - shows cameras in the road-level อุปกรณ์ CCTV panel instead of inside a
 *    จุดติดตั้ง tab (CctvEquipmentSection).
 *
 *  The backend refuses `POST /manage/solution` with this type for the same
 *  reason, so hiding it here is what keeps the UI from offering a dead end.
 *
 *  Mirrors SOLUTION_TYPE.CCTV in @/types/manage/solution-api — kept local so
 *  this feature does not depend on the legacy settings tree's imports.
 */
export const SOLUTION_TYPE_CCTV = 1
