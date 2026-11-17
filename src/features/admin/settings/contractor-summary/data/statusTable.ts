import type {
  DeviceTotals,
  ProjectDeviceStatusBase,
  ProjectDeviceStatusRow,
  ProjectDeviceSummaryRow,
} from '@/types/manage/device-status-api'

/** A row of ทั้งหมด / ในค้ำ / หมดค้ำ's table: CCTV, VMS and Street Light as
 *  before, then Traffic Signal, Bridge Lighting, Crosswalk and Tunnel (user
 *  2026-11-17) — the seven types นอกเหนือการรับประกัน records too. */
export interface ProjectStatusTableRow extends ProjectDeviceStatusRow {
  /** The controllers. */
  traffic: DeviceTotals
  /** The installations. */
  bridge_lighting: DeviceTotals
  /** The crossings. */
  crosswalk: DeviceTotals
  /** The tunnels (/summary's `tunnel.system`, BE 2026-11-17) — the unit the
   *  Tunnel ring counts; the export's สรุป sheet keeps the sample's sensors. */
  tunnel: DeviceTotals
}

const ZERO: DeviceTotals = { total: 0, online: 0, offline: 0 }

const or0 = (totals: DeviceTotals | null | undefined): DeviceTotals => totals ?? ZERO

const add = (sum: DeviceTotals, totals: DeviceTotals | null | undefined): DeviceTotals => ({
  total: sum.total + (totals?.total ?? 0),
  online: sum.online + (totals?.online ?? 0),
  offline: sum.offline + (totals?.offline ?? 0),
})

/** Every camera /summary counts, each once — for a project /device-status
 *  leaves out (nothing under CCTV, VMS or Street Light: a junction's
 *  controllers and their cameras, say). */
export const summaryCameras = (row: ProjectDeviceSummaryRow): DeviceTotals =>
  [row.cctv, row.counting, row.analytic, row.lpr, row.traffic?.camera, row.crosswalk?.camera, row.vms?.camera].reduce(add, ZERO)

const baseOf = (row: ProjectDeviceSummaryRow): ProjectDeviceStatusBase => ({
  project_id: row.project_id,
  project_name: row.project_name,
  contract_no: row.contract_no,
  budget_year: row.budget_year,
  department: row.department,
  contractor: row.contractor,
  warranty_start_date: row.warranty_start_date,
  warranty_end_date: row.warranty_end_date,
  is_warranty: row.is_warranty,
  access_scope: row.access_scope,
  roads: row.roads,
})

/** The project from /device-status/summary — every project under the
 *  filters, every system counted — with its cameras, VMS and street lights
 *  as /device-status counts them when it lists the project: CCTV is every
 *  camera of the project, the ones its ▷▷ opens, as the column always was. */
export const statusTableRow = (summary: ProjectDeviceSummaryRow, listed?: ProjectDeviceStatusRow): ProjectStatusTableRow => ({
  ...baseOf(summary),
  cameras: listed?.cameras ?? summaryCameras(summary),
  vms: listed?.vms ?? or0(summary.vms?.system),
  lighting: listed?.lighting ?? or0(summary.lighting),
  traffic: or0(summary.traffic?.system),
  bridge_lighting: or0(summary.bridge_lighting),
  crosswalk: or0(summary.crosswalk?.system),
  tunnel: or0(summary.tunnel?.system),
})

/** /device-status's rows by project, for `statusTableRow`. */
export const listedById = (rows: ProjectDeviceStatusRow[]): ReadonlyMap<number, ProjectDeviceStatusRow> =>
  new Map(rows.map((row) => [row.project_id, row]))
