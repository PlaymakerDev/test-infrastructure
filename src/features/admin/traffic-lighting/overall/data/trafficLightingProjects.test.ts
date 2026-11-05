import { describe, expect, it } from 'vitest'
import type { OverviewCentralItem } from '@/types/lighting'
import { mapCentralListToProjects } from './trafficLightingProjects'

describe('mapCentralListToProjects', () => {
  it('preserves API-backed values and leaves unavailable detail fields unknown', () => {
    const response: OverviewCentralItem[] = [{
      department_id: 1,
      department_short_name: 'สทช. 1',
      sub_department: [{
        department_id: 10,
        department_short_name: 'ขทช. ตัวอย่าง',
        solutions: [{
          is_warranty: true,
          lighting: {
            equipment: { count: 4, type: 'lamp' },
            has_broken_wire: false,
            is_online: true,
          },
          project: {
            budget_year: 2569,
            contract_no: 'TEST/1',
            id: 99,
            project_name: 'โครงการทดสอบ',
          },
          proxy_url: '',
          road: { id: 7, code_name: 'ทด.1001' },
          solution: { id: 1910, solution_name: 'จุดติดตั้งทดสอบ' },
          GeometryPoint: [100.5, 13.7],
          imei: '860946061754746',
        }],
      }],
    }]

    expect(mapCentralListToProjects(response)).toEqual([expect.objectContaining({
      id: '860946061754746',
      rowKey: '860946061754746',
      imei: '860946061754746',
      solutionId: 1910,
      warranty: 'in-warranty',
      connection: 'online',
      phase: null,
      lineStatus: 'unknown',
      circuitStatus: 'normal',
      equipment: { count: 4, type: 'lamp' },
    })])
  })

  it('gives every row its own key when the list repeats a device', () => {
    // sol 5296 came back twice with one IMEI (2026-10-26): both rows keep the
    // IMEI as `id` (the detail link), but React needs two different keys.
    const row = (solutionId: number, imei: string) => ({
      is_warranty: true,
      lighting: { equipment: { count: 1, type: 'phase' }, has_broken_wire: false, is_online: true },
      project: { budget_year: 2569, contract_no: 'ขทช.รย./17/2569', id: 1, project_name: 'p' },
      proxy_url: '',
      road: { id: 1, code_name: 'รย.4010' },
      solution: { id: solutionId, solution_name: 'รย.4010 ตู้ที่ 2 กม.1+450' },
      GeometryPoint: [101.2, 12.7] as [number, number],
      imei,
    })
    const response: OverviewCentralItem[] = [{
      department_id: 4,
      department_short_name: 'สทช.3 (ชลบุรี)',
      sub_department: [{
        department_id: 40,
        department_short_name: 'ขทช.ระยอง',
        solutions: [row(5296, '860946061763218'), row(5296, '860946061763218'), row(5297, ''), row(5298, '860946061763218')],
      }],
    }]

    const projects = mapCentralListToProjects(response)
    expect(projects.map((p) => p.id)).toEqual(['860946061763218', '860946061763218', '5297-0', '860946061763218'])
    expect(projects.map((p) => p.rowKey)).toEqual(['860946061763218', '860946061763218~2', '5297-0', '860946061763218~3'])
  })
})
