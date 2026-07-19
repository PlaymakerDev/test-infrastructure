// Mock data — โครงการไฟจราจรในระบบ
// Used by the Traffic Lighting screen (map markers + table).

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type LineStatus = 'normal' | 'abnormal'
export type CircuitStatus = 'normal' | 'abnormal'
export type LightingPhase = 1 | 3

export interface TrafficLightingProject {
  id: string
  /** รหัสสายทาง เช่น "นย.2024" */
  roadCode: string
  projectName: string
  installPoint: string
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  phase: LightingPhase
  lineStatus: LineStatus
  circuitStatus: CircuitStatus
  /** สำนัก — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  /** Equipment on this solution — drives which detail layout to show. */
  equipment: { count: number | null; type: string | null }
  /** Road id — drives the GRID view's "หน่วยงานที่รับผิดชอบ" lookup + Project Info
   *  modal. Only populated from the real central/list mapping below — absent
   *  on the detail page's sessionStorage-reconstructed project (see
   *  buildTrafficLightingProject), which never stashed it. */
  roadId?: number
  /** Project id — opens the Project Info modal from the GRID view. Same
   *  sessionStorage caveat as roadId. */
  projectId?: number
  budgetYear?: number
}

export const TRAFFIC_LIGHTING_PROJECTS: TrafficLightingProject[] = [
  {
    id: '1',
    roadCode: 'อน.3023',
    bureau: 'สทช.ที่ 2 อ่างทอง',
    projectName:
      'งานไฟฟ้าแสงสว่างและไฟสัญญาณจราจร ถนนสาย อน.3023 อ.เมืองอ่างทอง จ.อ่างทอง',
    installPoint: 'ตู้ที่ 2 กม.6+400',
    contractNo: 'ขทช.อน./05/2568',
    warranty: 'in-warranty',
    connection: 'online',
    phase: 3,
    lineStatus: 'normal',
    circuitStatus: 'normal',
    coord: [100.45, 14.59],
    equipment: { count: 3, type: 'phase' },
  },
  {
    id: 'tl-001',
    roadCode: 'นย.2024',
    bureau: 'สทช.ที่ 1 กรุงเทพมหานคร',
    projectName: 'งานไฟฟ้าแสงสว่างและไฟสัญญาณจราจร ถนนสาย นย.2024 อ.เมืองนนทบุรี จ.นนทบุรี',
    installPoint: 'ตู้ที่ 8 กม.17+800',
    contractNo: 'ขทช.นย./12/2568',
    warranty: 'in-warranty',
    connection: 'online',
    phase: 3,
    lineStatus: 'normal',
    circuitStatus: 'normal',
    coord: [100.5, 13.75],
    equipment: { count: 3, type: 'phase' },
  },
  {
    id: 'tl-002',
    roadCode: 'นย.2024',
    bureau: 'สทช.ที่ 1 กรุงเทพมหานคร',
    projectName: 'งานบำรุงรักษาระบบไฟจราจร ถนนสาย นย.2024 กม.18+200 อ.เมืองนนทบุรี จ.นนทบุรี',
    installPoint: 'ตู้ที่ 9 กม.18+200',
    contractNo: 'ขทช.นย./13/2568',
    warranty: 'in-warranty',
    connection: 'online',
    phase: 3,
    lineStatus: 'normal',
    circuitStatus: 'abnormal',
    coord: [100.51, 13.76],
    equipment: { count: 3, type: 'phase' },
  },
  {
    id: 'tl-003',
    roadCode: 'ชม.108',
    bureau: 'สทช.ที่ 17 เชียงราย',
    projectName: 'งานไฟฟ้าแสงสว่างและไฟสัญญาณจราจร ถนนสาย ชม.108 อ.เมืองเชียงใหม่ จ.เชียงใหม่',
    installPoint: 'ตู้ที่ 3 กม.12+450',
    contractNo: 'ขทช.ชม./49/2567',
    warranty: 'expired',
    connection: 'offline',
    phase: 3,
    lineStatus: 'abnormal',
    circuitStatus: 'abnormal',
    coord: [98.98, 18.79],
    equipment: { count: 3, type: 'phase' },
  },
  {
    id: 'tl-004',
    roadCode: 'ขก.2',
    bureau: 'สทช.ที่ 6 ขอนแก่น',
    projectName: 'งานบำรุงรักษาระบบไฟจราจร ถนนสาย ขก.2 อ.เมืองขอนแก่น จ.ขอนแก่น',
    installPoint: 'ตู้ที่ 5 กม.8+100',
    contractNo: 'ขทช.ขก./22/2568',
    warranty: 'in-warranty',
    connection: 'online',
    phase: 1,
    lineStatus: 'normal',
    circuitStatus: 'normal',
    coord: [102.83, 16.44],
    equipment: { count: 1, type: 'phase' },
  },
  {
    id: 'tl-005',
    roadCode: 'นฐ.304',
    bureau: 'สทช.ที่ 9 นครราชสีมา',
    projectName: 'งานไฟฟ้าแสงสว่างและไฟสัญญาณจราจร ถนนสาย นฐ.304 อ.เมืองนครราชสีมา จ.นครราชสีมา',
    installPoint: 'ตู้ที่ 2 กม.45+600',
    contractNo: 'ขทช.นฐ./08/2566',
    warranty: 'expired',
    connection: 'offline',
    phase: 3,
    lineStatus: 'abnormal',
    circuitStatus: 'normal',
    coord: [102.1, 14.97],
    equipment: { count: 3, type: 'phase' },
  },
  {
    id: 'tl-006',
    roadCode: 'พล.117',
    bureau: 'สทช.ที่ 5 พิษณุโลก',
    projectName: 'งานบำรุงรักษาระบบไฟจราจร ถนนสาย พล.117 อ.เมืองพิษณุโลก จ.พิษณุโลก',
    installPoint: 'ตู้ที่ 1 กม.3+200',
    contractNo: 'ขทช.พล./31/2568',
    warranty: 'in-warranty',
    connection: 'online',
    phase: 3,
    lineStatus: 'normal',
    circuitStatus: 'normal',
    coord: [99.97, 17.01],
    equipment: { count: 3, type: 'phase' },
  },
]

/** Lookup by id (mirrors traffic-signal / bridge-lighting pattern). */
export const getTrafficLightingById = (
  id: string,
): TrafficLightingProject | undefined =>
  TRAFFIC_LIGHTING_PROJECTS.find((p) => p.id === id)

/** Map a /overview/central/list response into the table's TrafficLightingProject[] shape.
 *  Each solution becomes one row; bureau = top-level department_short_name. */
import type { OverviewCentralItem } from '@/types/lighting'

export const mapCentralListToProjects = (
  items: OverviewCentralItem[],
): TrafficLightingProject[] => {
  const out: TrafficLightingProject[] = []
  // Several IMEIs can share one solution_id (e.g. solution 1910 → 8 devices),
  // so we key rows by imei when present and fall back to solution_id. A
  // running counter guarantees uniqueness even for empty-imei rows.
  let seq = 0
  for (const bureau of items) {
    for (const sub of bureau.sub_department ?? []) {
      for (const sol of sub.solutions ?? []) {
        const equip = sol.lighting?.equipment
        // Phase is only meaningful for "phase" cabinets; lamp arrays show '-'.
        const phase: LightingPhase = equip?.type === 'phase' ? 3 : 3
        const imei = sol.imei ?? ''
        out.push({
          id: imei || `${sol.solution.id}-${seq++}`,
          roadCode: sol.road?.code_name ?? '-',
          projectName: sol.project?.project_name ?? sol.solution?.solution_name ?? '-',
          installPoint: sol.solution?.solution_name ?? '-',
          contractNo: sol.project?.contract_no ?? '-',
          warranty: sol.is_warranty ? 'in-warranty' : 'expired',
          connection: sol.lighting?.is_online ? 'online' : 'offline',
          phase,
          // line/circuit status aren't in central/list — keep 'normal' as a
          // neutral default; the detail screen reads them per-IMEI.
          lineStatus: 'normal',
          circuitStatus: sol.lighting?.has_broken_wire ? 'abnormal' : 'normal',
          bureau: bureau.department_short_name ?? '-',
          coord: sol.GeometryPoint ?? [0, 0],
          equipment: { count: equip?.count ?? null, type: equip?.type ?? null },
          roadId: sol.road?.id,
          projectId: sol.project?.id,
          budgetYear: sol.project?.budget_year,
        })
      }
    }
  }
  return out
}
