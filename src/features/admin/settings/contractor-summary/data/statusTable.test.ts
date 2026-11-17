import { describe, expect, it } from 'vitest'
import type { DeviceTotals, ProjectDeviceStatusRow, ProjectDeviceSummaryRow } from '@/types/manage/device-status-api'
import { listedById, statusTableRow, summaryCameras } from './statusTable'

const t = (online: number, offline: number): DeviceTotals => ({ total: online + offline, online, offline })
const pair = (system: DeviceTotals, camera: DeviceTotals) => ({ system, camera })
const header = (id: number) => ({
  project_id: id,
  project_name: `โครงการ ${id}`,
  contract_no: `ส.${id}`,
  budget_year: 2569,
  department: { id: 24, department_short_name: 'ขทช.เลย' },
  contractor: { id: 'u', company_name: 'บริษัท เฟิร์สเทค ดีไซน์ จำกัด', short_name: 'ftd' },
  warranty_start_date: '2026-05-22',
  warranty_end_date: '2028-12-18',
  is_warranty: true,
  access_scope: 'project' as const,
  roads: [],
})
// เฟิร์สเทค on 2026-11-17: 1363 as both read it, and 521 — only /summary
// lists it (a junction's three controllers and their sixteen cameras).
const summary1363: ProjectDeviceSummaryRow = {
  ...header(1363),
  cctv: t(53, 52),
  counting: t(0, 6),
  analytic: t(22, 41),
  lpr: t(0, 2),
  traffic: pair(t(0, 0), t(0, 0)),
  crosswalk: pair(t(0, 0), t(0, 0)),
  lighting: t(1, 1),
  vms: pair(t(0, 0), t(0, 0)),
  bridge_lighting: t(0, 0),
  tunnel: { ...t(0, 0), system: t(0, 0) },
}
const listed1363: ProjectDeviceStatusRow = { ...header(1363), cameras: t(97, 105), vms: t(0, 0), lighting: t(1, 1) }
const summary521: ProjectDeviceSummaryRow = {
  ...header(521),
  cctv: t(0, 0),
  counting: t(0, 0),
  analytic: t(0, 0),
  lpr: t(0, 0),
  traffic: pair(t(0, 3), t(0, 16)),
  crosswalk: pair(t(1, 1), t(2, 0)),
  lighting: t(0, 0),
  vms: pair(t(0, 0), t(0, 0)),
  bridge_lighting: t(1, 0),
  tunnel: { ...t(14, 2), system: t(1, 0) },
}

describe('ทั้งหมด / ในค้ำ / หมดค้ำ — the seven types per project (user 2026-11-17)', () => {
  it('CCTV, VMS and Street Light as the list counts them — every camera of the project, as before', () => {
    const row = statusTableRow(summary1363, listedById([listed1363]).get(1363))
    expect(row).toMatchObject({ project_id: 1363, project_name: 'โครงการ 1363', is_warranty: true })
    expect([row.cameras, row.vms, row.lighting]).toEqual([t(97, 105), t(0, 0), t(1, 1)])
  })

  it('Traffic Signal, Crosswalk by their controllers, Bridge Lighting by installation, Tunnel by tunnel', () => {
    const row = statusTableRow(summary521)
    expect([row.traffic, row.crosswalk, row.bridge_lighting, row.tunnel]).toEqual([t(0, 3), t(1, 1), t(1, 0), t(1, 0)])
  })

  it('Tunnel: the tunnels /summary counts (tunnel.system, BE 2026-11-17), not its sensors — the Tunnel ring’s unit', () => {
    // แม่วาง (476) that day: 43 sensors, 13 of them reporting — one tunnel.
    const row = statusTableRow({ ...summary521, tunnel: { ...t(13, 30), system: t(1, 0) } })
    expect(row.tunnel).toEqual(t(1, 0))
    // A backend without `system` yet: no tunnels, rather than sensors as tunnels.
    expect(statusTableRow({ ...summary521, tunnel: t(13, 30) } as unknown as ProjectDeviceSummaryRow).tunnel).toEqual(t(0, 0))
  })

  it('a project the list leaves out: its cameras as the summary counts them, VMS and Street Light too', () => {
    expect(summaryCameras(summary521)).toEqual(t(2, 16))
    expect(summaryCameras(summary1363)).toEqual(t(75, 101))
    const row = statusTableRow(summary521, listedById([listed1363]).get(521))
    expect([row.cameras, row.vms, row.lighting]).toEqual([t(2, 16), t(0, 0), t(0, 0)])
  })

  it('a system the backend answers null for reads as none', () => {
    const row = statusTableRow({ ...summary521, traffic: null, tunnel: null } as unknown as ProjectDeviceSummaryRow)
    expect([row.traffic, row.tunnel]).toEqual([t(0, 0), t(0, 0)])
  })
})
