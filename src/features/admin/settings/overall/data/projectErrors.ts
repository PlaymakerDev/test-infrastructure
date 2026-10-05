/** Thai names of the /manage/project body fields, for validation errors. */
const FIELD_LABELS: Record<string, string> = {
  project_name: 'ชื่อโครงการ',
  budget_year: 'ปีงบประมาณ',
  contract_no: 'เลขที่สัญญา',
  project_no: 'รหัสโครงการ',
  department_id: 'ผู้ว่าจ้าง',
  contractor_id: 'ผู้รับจ้าง',
  project_road: 'สายทาง',
  warranty_start_date: 'วันที่เริ่มต้นค้ำประกัน',
  warranty_end_date: 'วันที่สิ้นสุดค้ำประกัน',
  contract_document: 'เอกสารเชื่อมต่อระบบ',
}

/** DELETE /manage/project/{id} answers 40098 while any จุดติดตั้ง still hangs
 *  off the project — which is every new project, since the backend creates
 *  "จุดติดตั้งที่ 1" on each of its roads. Wording: user 2026-10-02. */
export const PROJECT_DELETE_BLOCKED =
  'ไม่สามารถลบโครงการได้ กรุณาลบสายทางและจุดติดตั้งภายในสายทางทั้งหมดก่อน'

interface ProjectErrorBody {
  res_code?: number
  details?: unknown
  res_data?: { message?: unknown; details?: unknown; keys?: unknown }
}

/** What a failed /manage/project call (create / update / delete) should say.
 *
 *  - 40098: the delete is blocked by จุดติดตั้ง — see PROJECT_DELETE_BLOCKED.
 *  - 40010 + `res_data.keys`: fields the backend still requires, named in
 *    Thai instead of its bare "required". (PUT still demands project_no
 *    though the form leaves it optional on purpose — a backend fix, user
 *    2026-09-26 — so editing a project that has none lands here.)
 *  - else the backend's own message / details, then axios's, then fallback. */
export const projectErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback
  const withResponse = error as { response?: { data?: ProjectErrorBody }; message?: string }
  const body = withResponse.response?.data
  if (body?.res_code === 40098) return PROJECT_DELETE_BLOCKED
  const keys = body?.res_data?.keys
  if (Array.isArray(keys) && keys.length > 0) {
    const fields = keys.map((key) => FIELD_LABELS[String(key)] ?? String(key))
    return `${fallback} — ยังไม่ได้ระบุ${fields.join(', ')}`
  }
  const detail = body?.res_data?.message ?? body?.res_data?.details ?? body?.details
  if (typeof detail === 'string' && detail.trim()) return detail
  if (detail && typeof detail === 'object') return JSON.stringify(detail)
  return withResponse.message ?? fallback
}
