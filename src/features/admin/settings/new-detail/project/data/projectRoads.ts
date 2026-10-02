import dayjs from 'dayjs'
import type { APIRequestProjectUpdate, APIResponseProject } from '@/types/manage/project-api'
import type { RoadSolutionList } from '@/types/manage/project-detail-api'

/** GET /manage/project/{id} as it actually arrives: the public type doesn't
 *  declare the road links, which the server ships as `project_roads` (the
 *  singular spelling is a fallback, same as FormCreateProject reads). */
export type ProjectDetailWithRoads = APIResponseProject & {
  project_roads?: { project_road_id: number; road_id: number }[] | null
  project_road?: { project_road_id?: number; road_id: number }[] | null
}

export const projectRoadLinks = (detail: ProjectDetailWithRoads) =>
  detail.project_roads ?? detail.project_road ?? []

/** Labels for every field PUT /manage/project binds as required. */
const REQUIRED_FIELD_LABELS: Record<string, string> = {
  project_name: 'ชื่อโครงการ',
  contract_no: 'เลขที่สัญญา',
  budget_year: 'ปีงบประมาณ',
  project_no: 'รหัสโครงการ',
  department_id: 'ผู้ว่าจ้าง',
  contractor_id: 'ผู้รับจ้าง',
  warranty_start_date: 'วันที่เริ่มต้นค้ำประกัน',
  warranty_end_date: 'วันที่สิ้นสุดค้ำประกัน',
  contract_document: 'เอกสารเชื่อมต่อระบบ',
  project_road: 'สายทาง',
}

const isBlank = (value: unknown) =>
  value == null || (typeof value === 'string' && value.trim() === '') || value === 0

/** The fields a PUT would be refused for (400 "required"). There is no
 *  endpoint that adds one road on its own, so adding a road re-sends the whole
 *  project — which the backend only takes once these are filled in. Most
 *  projects made before 2026-09-25 have no เอกสารเชื่อมต่อระบบ yet. */
export const missingProjectFields = (detail: ProjectDetailWithRoads): string[] => {
  const missing: string[] = []
  const check = (key: string, value: unknown) => {
    if (isBlank(value)) missing.push(REQUIRED_FIELD_LABELS[key])
  }
  check('project_name', detail.project_name)
  check('contract_no', detail.contract_no)
  check('budget_year', detail.budget_year)
  check('project_no', detail.project_no)
  check('department_id', detail.department_id)
  check('contractor_id', detail.contractor_id)
  check('warranty_start_date', detail.warranty_start_date)
  check('warranty_end_date', detail.warranty_end_date)
  check('contract_document', detail.contract_document?.document_url)
  return missing
}

/** The `keys` a 400 "required" names, as labels — for a refusal the check
 *  above didn't predict (the project changed in between). */
export const missingFieldsFromError = (error: unknown): string[] => {
  const keys = (error as { response?: { data?: { res_data?: { keys?: unknown } } } })
    ?.response?.data?.res_data?.keys
  if (!Array.isArray(keys)) return []
  return keys.map((key) => REQUIRED_FIELD_LABELS[String(key)] ?? String(key))
}

/** The server sends date-only fields as UTC midnight ("2026-09-28T00:00:00Z");
 *  take the date as written instead of re-reading it in local time. */
const toDateOnly = (value: string) => {
  const match = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.0+)?Z$/.exec(value)
  return match ? match[1] : dayjs(value).format('YYYY-MM-DD')
}

/** PUT body that adds one road and leaves the rest of the project as it is.
 *  Every existing road goes back with its `project_road_id` — the backend
 *  deletes any row the body leaves out — and the new one without, which the
 *  backend inserts along with its "จุดติดตั้งที่ 1". The document link goes
 *  back as read (signed); the backend strips the signature before storing. */
export const buildAddRoadBody = (detail: ProjectDetailWithRoads, roadId: number): APIRequestProjectUpdate => ({
  id: detail.id,
  project_name: detail.project_name,
  contract_no: detail.contract_no,
  project_no: detail.project_no ?? '',
  budget_year: detail.budget_year,
  department_id: detail.department_id,
  contractor_id: detail.contractor_id,
  warranty_start_date: toDateOnly(detail.warranty_start_date),
  warranty_end_date: toDateOnly(detail.warranty_end_date),
  contract_document: {
    document_url: detail.contract_document?.document_url ?? '',
    file_name: detail.contract_document?.file_name ?? '',
  },
  project_road: [
    ...projectRoadLinks(detail).map((link) => ({
      road_id: link.road_id,
      ...(link.project_road_id ? { project_road_id: link.project_road_id } : {}),
    })),
    { road_id: roadId },
  ],
})

export const roadLabel = (road?: { road_code?: string | null; road_name?: string | null } | null) =>
  road?.road_code
    ? `${road.road_code}${road.road_name ? ` - ${road.road_name}` : ''}`
    : road?.road_name || '-'

/** The tab to land on after a road is deleted: the one before it, else the
 *  new first one; `undefined` when none are left. */
export const roadAfterDelete = (
  before: RoadSolutionList[],
  deletedId: number,
  after: RoadSolutionList[],
): RoadSolutionList | undefined => {
  const index = before.findIndex((road) => road.project_road_id === deletedId)
  const previous = index > 0 ? before[index - 1] : undefined
  return (previous && after.find((road) => road.project_road_id === previous.project_road_id)) ?? after[0]
}
