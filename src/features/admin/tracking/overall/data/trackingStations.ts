// Mock tracking stations — รายการสถานี/WIM/หน่วยเคลื่อนที่ ที่แสดงบนแผนที่ภาพรวม
// แต่ละจุดจะ render เป็น pin marker สีตามประเภท + popup สรุปข้อมูล

export type TrackingStationType = 'wim' | 'mobile' | 'station'

export interface TrackingStation {
  id: string
  /** รหัสสายทาง เช่น "ชม.3035" */
  code: string
  /** ชื่อหัวข้อใน popup เช่น "WIM เชียงใหม่" */
  name: string
  type: TrackingStationType
  coord: [number, number]
  status: 'open' | 'closed'
  /** วันที่เปิดด่านล่าสุด — แสดงในรูปแบบไทย เช่น "20 เม.ย. 69" */
  lastOpenDate: string
  /** จำนวนรถเข้าชั่งทั้งหมด */
  totalVehicles: number
  /** จำนวนรถน้ำหนักเกิน */
  overweightVehicles: number
}

export const TRACKING_STATION_COLORS: Record<TrackingStationType, string> = {
  wim:     '#FCD116', // เหลือง
  mobile:  '#EB66FF', // ม่วงพิ้งค์
  station: '#66FF9E', // เขียว
}

export const TRACKING_STATION_LABELS: Record<TrackingStationType, string> = {
  wim:     'WIM',
  mobile:  'เคลื่อนที่',
  station: 'สถานี',
}

// ตัวอย่างข้อมูล mock — เอาไปใช้บนแผนที่ภาพรวม
export const TRACKING_STATIONS: TrackingStation[] = [
  // ── WIM (เหลือง) ──
  { id: 'wim-cm-3035', code: 'ชม.3035', name: 'WIM เชียงใหม่', type: 'wim',
    coord: [98.985, 18.788], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 1920, overweightVehicles: 2 },
  { id: 'wim-kk-1023', code: 'ขก.1023', name: 'WIM ขอนแก่น', type: 'wim',
    coord: [102.836, 16.441], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 2410, overweightVehicles: 5 },
  { id: 'wim-nm-2009', code: 'นม.2009', name: 'WIM นครราชสีมา', type: 'wim',
    coord: [102.097, 14.980], status: 'open', lastOpenDate: '19 เม.ย. 69',
    totalVehicles: 3120, overweightVehicles: 8 },
  { id: 'wim-cb-3008', code: 'ชบ.3008', name: 'WIM ชลบุรี', type: 'wim',
    coord: [100.985, 13.361], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 2790, overweightVehicles: 4 },
  { id: 'wim-pt-1004', code: 'ปท.1004', name: 'WIM ปทุมธานี', type: 'wim',
    coord: [100.525, 14.021], status: 'closed', lastOpenDate: '15 เม.ย. 69',
    totalVehicles: 0, overweightVehicles: 0 },
  { id: 'wim-su-1001', code: 'สฎ.1001', name: 'WIM สุราษฎร์ธานี', type: 'wim',
    coord: [99.322, 9.138], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 1450, overweightVehicles: 1 },
  { id: 'wim-sk-2002', code: 'สข.2002', name: 'WIM สงขลา', type: 'wim',
    coord: [100.595, 7.190], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 1830, overweightVehicles: 3 },
  { id: 'wim-ub-1005', code: 'อบ.1005', name: 'WIM อุบลราชธานี', type: 'wim',
    coord: [104.847, 15.245], status: 'open', lastOpenDate: '19 เม.ย. 69',
    totalVehicles: 1670, overweightVehicles: 2 },

  // ── สถานี (เขียว) ──
  { id: 'st-ay-001', code: 'อย.001', name: 'สถานีตรวจสอบน้ำหนัก พระนครศรีอยุธยา', type: 'station',
    coord: [100.568, 14.353], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 4220, overweightVehicles: 12 },
  { id: 'st-sb-001', code: 'สบ.001', name: 'สถานีตรวจสอบน้ำหนัก สระบุรี', type: 'station',
    coord: [100.911, 14.529], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 5180, overweightVehicles: 18 },
  { id: 'st-rb-001', code: 'รบ.001', name: 'สถานีตรวจสอบน้ำหนัก ราชบุรี', type: 'station',
    coord: [99.818, 13.537], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 3890, overweightVehicles: 10 },

  // ── เคลื่อนที่ (ม่วง) ──
  { id: 'mob-bkk-001', code: 'กท.M01', name: 'หน่วยเคลื่อนที่ กรุงเทพ', type: 'mobile',
    coord: [100.502, 13.754], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 380, overweightVehicles: 1 },
  { id: 'mob-cm-001', code: 'ชม.M01', name: 'หน่วยเคลื่อนที่ เชียงใหม่', type: 'mobile',
    coord: [98.965, 18.768], status: 'open', lastOpenDate: '20 เม.ย. 69',
    totalVehicles: 240, overweightVehicles: 0 },
]
