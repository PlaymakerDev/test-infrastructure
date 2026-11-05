import { describe, expect, it } from 'vitest'
import type { LightingSolutionDetail } from '@/types/lighting'
import { buildTrafficLightingProject, lightingRowFromSolution } from './buildTrafficLightingProject'

// /lighting/solutions/4725 as it answered on 2026-11-05 (two of its 180 lamps).
const lampPoint: LightingSolutionDetail = {
  project: {
    id: 209,
    project_name: 'โครงการติดตั้งระบบการตรวจสอบและแจ้งเตือนไฟฟ้าส่องสว่างแบบระยะไกล อ.บางกรวย จ.นนทบุรี',
    contract_no: 'สบร.117/2568',
    project_no: 'FT25029',
    budget_year: 2568,
    warranty_start_date: '25/03/2568',
    warranty_end_date: '24/04/2570',
    is_warranty: true,
    department_id: 96,
  },
  road: { id: 3303, road_code: 'นบ.1020 (นครอินทร์) ', road_name: 'นครอินทร์' },
  solution: { id: 4725, solution_name: 'ถ.นครอินทร์ - ทางแยกต่างระดับบางคูเวียง', sta: null, ip_address: '', remarks: '' },
  lighting: {
    id: 1207,
    lighting_type: 1,
    proxy_url: 'https://its.drr.go.th/sem-detail?wid=2107&type=Lora_Gateway',
    iot: null,
    lora: { online_count: 0, offline_count: 180, is_online: false },
    devices: [
      { id: 1, device_id: '24E124746F069297', pole_number: 1, device_type: 'SEM', device_desc: 'CT Sensor', last_connectd: '14/07/2568 22:05:10', last_update: '' },
      { id: 2, device_id: '24E124746F069780', pole_number: 2, device_type: 'SEM', device_desc: 'CT Sensor', last_connectd: '14/07/2568 22:05:10', last_update: '' },
    ],
  },
}

describe('lightingRowFromSolution — the header without the department list', () => {
  it('names the point as the central list would', () => {
    const project = buildTrafficLightingProject('4725-0', lightingRowFromSolution(lampPoint), 'lamp')
    expect(project).toMatchObject({
      id: '4725-0',
      imei: undefined,
      roadCode: 'นบ.1020 (นครอินทร์)',
      installPoint: 'ถ.นครอินทร์ - ทางแยกต่างระดับบางคูเวียง',
      contractNo: 'สบร.117/2568',
      warranty: 'in-warranty',
      connection: 'offline',
      equipment: { count: 2, type: 'lamp' },
      roadId: 3303,
      solutionId: 4725,
      projectId: 209,
      budgetYear: 2568,
    })
  })

  it('a cabinet: its IMEI and its own state, and no lamp count', () => {
    const row = lightingRowFromSolution({
      ...lampPoint,
      lighting: {
        ...lampPoint.lighting,
        lighting_type: 2,
        lora: null,
        devices: [],
        iot: {
          id: 996,
          imei: ' 860946061762707 ',
          phase_type: '3p',
          sem_type: '',
          diagram_type: '',
          connection_type: '',
          send_frequency: '',
          last_update: '02/11/2569 16:33:11',
          is_online: true,
          has_broken_wire: true,
        },
      },
    })
    expect(row).toMatchObject({ imei: '860946061762707', connection: 'online', circuitStatus: 'abnormal' })
    expect(row.equipment?.count).toBeNull()
  })
})
