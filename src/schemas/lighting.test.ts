import { describe, expect, it } from 'vitest'
import {
  apiResponseLightingLampCurrentHourlySchema,
  apiResponseLightingLampSummarySchema,
  apiResponseLightingLampsSchema,
  apiResponseLightingLampsWeeklySchema,
  apiResponseLightingSolutionSchema,
} from './lighting'

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

// Shapes copied from the live /lighting/solutions/{solution_id}/lamps* (2026-11-05).
const lamp = {
  device_id: '24E124746F069297',
  dev_eui: '',
  device_type: 'SEM',
  pole: '1',
  lamp_type: '1',
  current: 0,
  status: 'ดับ',
  state: 'ดับ 1 โคม',
  is_online: false,
  battery: 0,
  rssi: -95,
  sta: '',
  highmast_group: '1',
  lat: 13.824311,
  lng: 100.446622,
  last_update: '14/07/2568 22:05:10',
}

describe('lamp endpoints', () => {
  it('parses the lamps of a point — status, connection, current and last report per lamp', () => {
    const result = apiResponseLightingLampsSchema.safeParse({
      solution_id: 4725,
      wid: 2107,
      total: 2,
      lamps: [
        lamp,
        { ...lamp, device_id: '10D4B', pole: '2', status: 'ปกติ', state: 'ใช้งานได้', is_online: true, current: null, battery: 3.6, rssi: 0, highmast_group: '', last_update: '' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a lamp whose pole comes as a number', () => {
    const result = apiResponseLightingLampsSchema.safeParse({ solution_id: 1, wid: 1, total: 1, lamps: [{ ...lamp, pole: 1 }] })
    expect(result.success).toBe(false)
  })

  it('parses the work-master tally with the point position', () => {
    const result = apiResponseLightingLampSummarySchema.safeParse({
      solution_id: 4725,
      wid: 2107,
      detail: 'ถ.นครอินทร์ - ทางแยกต่างระดับบางคูเวียง',
      lat: 13.822369,
      lng: 100.427275,
      total: 180,
      work: 1,
      fail: 179,
    })
    expect(result.success).toBe(true)
  })

  it('parses the 7-day tally, and a point with none', () => {
    expect(apiResponseLightingLampsWeeklySchema.safeParse({
      solution_id: 4396,
      wid: 60,
      days: [
        { date: '30/10/69', total: 414, work: 286, fail: 128 },
        { date: '31/10/69', total: 414, work: 286, fail: 128 },
      ],
    }).success).toBe(true)
    expect(apiResponseLightingLampsWeeklySchema.safeParse({ solution_id: 4398, wid: 132, days: [] }).success).toBe(true)
  })

  it('parses the hourly current — the whole point, and one lamp by its raw id', () => {
    const hour = (h: string, avg: number | null, lamps = 0) => ({
      hour: h, avg_amp: avg, min_amp: avg, max_amp: avg, lamps, samples: lamps,
    })
    expect(apiResponseLightingLampCurrentHourlySchema.safeParse({
      solution_id: 4788,
      wid: 2437,
      date: '2026-11-05',
      device_id: null,
      hours: [hour('00:00', null), hour('18:00', 0.42, 12), hour('07:00', 0, 3)],
    }).success).toBe(true)
    expect(apiResponseLightingLampCurrentHourlySchema.safeParse({
      solution_id: 4788,
      wid: 2437,
      date: '2026-11-05',
      device_id: '24E124746F137262 ',
      hours: [hour('00:00', null)],
    }).success).toBe(true)
  })
})
