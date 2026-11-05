import { describe, expect, it } from 'vitest'
import { apiResponseLightingSolutionSchema } from './lighting'

// Shapes copied from the live /lighting/solutions/{solution_id} (2026-11-02).
const project = {
  id: 1126,
  project_name: 'อจ.3022',
  contract_no: null,
  project_no: null,
  budget_year: 2568,
  warranty_start_date: null,
  warranty_end_date: null,
  is_warranty: false,
  department_id: 36,
}

describe('apiResponseLightingSolutionSchema', () => {
  it('parses a lamp point — a LoRa gateway with its lamps, no IoT cabinet', () => {
    const result = apiResponseLightingSolutionSchema.safeParse({
      project,
      road: { id: 1402, road_code: 'อจ.3022', road_name: 'แยก ทล. 2159 (กม.ที่ 8+580)' },
      solution: { id: 4788, solution_name: 'อจ.3022', sta: null, ip_address: '', remarks: '' },
      lighting: {
        id: 4787,
        lighting_type: 1,
        proxy_url: 'https://its.drr.go.th/sem-detail?wid=2437&type=Lora_Gateway',
        iot: null,
        lora: { online_count: 171, offline_count: 206, is_online: false },
        devices: [
          { id: 5171, device_id: '24E124746F137667', pole_number: 1, device_type: 'SEM', device_desc: 'CT Sensor', last_connectd: '15/09/2569 07:36:28', last_update: '' },
        ],
      },
    })
    expect(result.success).toBe(true)
  })

  it('parses a cabinet — an IoT box, no gateway, an empty lamp list', () => {
    const result = apiResponseLightingSolutionSchema.safeParse({
      project: {
        id: 166,
        project_name: 'จ้างก่อสร้างงานบำรุง สวนสาธารณะกัลปพฤกษ์และถนนกัลปพฤกษ์ เขตบางแค กรุงเทพมหานคร',
        contract_no: 'สบร.198/2567',
        project_no: 'FT24080',
        budget_year: 2567,
        warranty_start_date: '05/08/2567',
        warranty_end_date: '02/01/2570',
        is_warranty: true,
        department_id: 95,
      },
      road: { id: 5, road_code: 'กท.1001', road_name: 'ถนนกัลปพฤกษ์' },
      solution: { id: 4560, solution_name: 'กท.1001 สวนเลียบ(เก่า) ตู้ที่ 1 กม.6+000', sta: '6+000', ip_address: '', remarks: '' },
      lighting: {
        id: 1042,
        lighting_type: 2,
        proxy_url: 'https://its.drr.go.th/SEMNB-iotCab3P?wid=1675&type=iot4g-67&imei=860946061762707',
        iot: {
          id: 996,
          imei: '860946061762707',
          phase_type: '3p',
          sem_type: 'nbiot_cab_3p_line_check_2w',
          diagram_type: '3STW-3MCB-1PW-1MC-2CB',
          connection_type: '',
          send_frequency: '',
          last_update: '02/11/2569 16:33:11',
          is_online: true,
          has_broken_wire: true,
        },
        lora: null,
        devices: [],
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a lamp whose pole number comes as text', () => {
    const result = apiResponseLightingSolutionSchema.safeParse({
      project,
      road: { id: 1, road_code: 'x', road_name: 'x' },
      solution: { id: 1, solution_name: 'x', sta: null, ip_address: null, remarks: '' },
      lighting: {
        id: 1,
        lighting_type: 1,
        proxy_url: '',
        iot: null,
        lora: null,
        devices: [{ id: 1, device_id: 'a', pole_number: '1', device_type: 'SEM', device_desc: '', last_connectd: '', last_update: '' }],
      },
    })
    expect(result.success).toBe(false)
  })
})
