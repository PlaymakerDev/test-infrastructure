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
})
