// Mock data — โครงการเก็บข้อมูลปริมาณจราจร (Traffic Value)
// Mirrors the traffic-signal mock shape so the overall UI can render
// end-to-end before the backend is wired up.

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type StationType = 'Permanent' | 'Mobile'

export interface TrafficVolumeProject {
  /** Solution id — what `/counting/details/{id}` is keyed by. */
  id: string
  /** Project / contract entity id — used by Project Info modal. */
  projectId?: string
  /** Road entity id — resolves responsible department. */
  roadId?: string
  /** รหัสสายทาง เช่น "กท.1001" */
  roadCode: string
  /** ชื่อโครงการเต็ม — central-list API does not return this; optional. */
  projectName?: string
  /** จุดติดตั้ง — populated from `solution.solution_name` when adapting API rows. */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  /** True when at least one camera under the solution is online. */
  stream: boolean
  /** ประเภทสถานี — mock-only; not exposed by the central-list endpoint. */
  stationType?: StationType
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker — mock-only; central-list has no coords. */
  coord?: [number, number]
  // ── Counts (summary view) ──────────────────────────────────────────────
  /** จำนวนเครื่องนับ/เซ็นเซอร์ทั้งหมด */
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  // ── Live values ────────────────────────────────────────────────────────
  /** ปริมาณจราจร (คัน) — from `traffic_count` on the central-list endpoint. */
  trafficCount?: number
  /** PCU สะสมประจำวัน — mock-only. */
  dailyPCU?: number
  /** ปริมาณรถในชั่วโมงเร่งด่วน — mock-only. */
  peakHourVehicles?: number
  /** ความเร็วเฉลี่ย (กม./ชม.) — mock-only. */
  avgSpeed?: number
}

export const TRAFFIC_VOLUME_PROJECTS: TrafficVolumeProject[] = [
  // ── ส่วนกลาง ────────────────────────────────────────────────────────────
  {
    id: 'tv-001', roadCode: 'กท.1001', bureau: 'ส่วนกลาง',
    projectName: 'โครงการเก็บข้อมูลปริมาณจราจร สาย กท.1001 ถนนกัลปพฤกษ์ อ.บางแค จ.กรุงเทพมหานคร',
    installPoint: 'กท.1001 จุดเก็บข้อมูล กม.3+200',
    contractNo: 'สอป.21/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    stationType: 'Permanent',
    coord: [100.430, 13.720],
    totalDevices: 8, onlineDevices: 8, offlineDevices: 0,
    dailyPCU: 18420, peakHourVehicles: 5320, avgSpeed: 48.5,
  },

  // ── สทช.1 ปทุมธานี ──────────────────────────────────────────────────────
  {
    id: 'tv-002', roadCode: 'ปท.3010', bureau: 'สทช.1 ปทุมธานี',
    projectName: 'งานเก็บข้อมูลปริมาณจราจรสาย ปท.3010 อ.คลองหลวง จ.ปทุมธานี',
    installPoint: 'ปท.3010 กม.5+100',
    contractNo: 'คค0709/45/2566',
    warranty: 'expired', connection: 'offline', stream: false,
    stationType: 'Permanent',
    coord: [100.620, 14.020],
    totalDevices: 6, onlineDevices: 0, offlineDevices: 6,
    dailyPCU: 0, peakHourVehicles: 0, avgSpeed: 0,
  },

  // ── สทช.13 ฉะเชิงเทรา ───────────────────────────────────────────────────
  {
    id: 'tv-003', roadCode: 'ฉช.3001', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'งานเก็บข้อมูลปริมาณจราจรสาย ฉช.3001 ตอนฉะเชิงเทรา อ.บ้านโพธิ์ จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.3001 กม.7+900',
    contractNo: 'สทช.13/91/2566',
    warranty: 'expired', connection: 'online', stream: true,
    stationType: 'Mobile',
    coord: [101.080, 13.685],
    totalDevices: 4, onlineDevices: 4, offlineDevices: 0,
    dailyPCU: 6240, peakHourVehicles: 1820, avgSpeed: 52.0,
  },
  {
    id: 'tv-004', roadCode: 'ฉช.4050', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'โครงการเก็บข้อมูลปริมาณจราจร สาย ฉช.4050 อ.เมืองฉะเชิงเทรา จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.4050 จุดที่ 6 กม.5+680',
    contractNo: 'สอป.72/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    stationType: 'Permanent',
    coord: [101.060, 13.700],
    totalDevices: 6, onlineDevices: 5, offlineDevices: 1,
    dailyPCU: 7820, peakHourVehicles: 2340, avgSpeed: 55.4,
  },
  {
    id: 'tv-005', roadCode: 'ฉช.4050', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'โครงการเก็บข้อมูลปริมาณจราจร สาย ฉช.4050 อ.เมืองฉะเชิงเทรา จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.4050 จุดที่ 8 กม.8+786',
    contractNo: 'สอป.73/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    stationType: 'Permanent',
    coord: [101.070, 13.715],
    totalDevices: 4, onlineDevices: 4, offlineDevices: 0,
    dailyPCU: 5210, peakHourVehicles: 1530, avgSpeed: 60.1,
  },
  {
    id: 'tv-006', roadCode: 'ฉช.3204', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'งานเก็บข้อมูลปริมาณจราจร ฉช.3204 แยกบ้านโพธิ์',
    installPoint: 'ฉช.3204 แยกบ้านโพธิ์',
    contractNo: 'สทช.13/108/2567',
    warranty: 'in-warranty', connection: 'online', stream: true,
    stationType: 'Mobile',
    coord: [101.150, 13.690],
    totalDevices: 3, onlineDevices: 3, offlineDevices: 0,
    dailyPCU: 3890, peakHourVehicles: 1140, avgSpeed: 49.7,
  },
  {
    id: 'tv-007', roadCode: 'ฉช.2002', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'โครงการติดตั้งสถานีเก็บข้อมูลปริมาณจราจร ฉช.2002',
    installPoint: 'ฉช.2002 แยกบางคล้า',
    contractNo: 'สทช.13/112/2567',
    warranty: 'expired', connection: 'offline', stream: false,
    stationType: 'Permanent',
    coord: [101.205, 13.720],
    totalDevices: 4, onlineDevices: 0, offlineDevices: 4,
    dailyPCU: 0, peakHourVehicles: 0, avgSpeed: 0,
  },
]

/** CCTV / sensor camera previews shown in the left rail. */
export interface TrafficVolumeCamera {
  id: string
  code: string
  ipAddress: string
  stationType: StationType
  /** Lane count handled by the device */
  lanes: number
}

export const TRAFFIC_VOLUME_CAMERAS: TrafficVolumeCamera[] = [
  {
    id: 'tvc-001',
    code: '684M-TVL2001-FAI003-กม.6+350-มุ่งหน้ากรุงเทพฯ',
    ipAddress: '10.14.7.3',
    stationType: 'Permanent',
    lanes: 4,
  },
  {
    id: 'tvc-002',
    code: '69MST-TVL3073-TF012-กม.0+350-สถานีเก็บข้อมูล',
    ipAddress: '10.14.2.1',
    stationType: 'Mobile',
    lanes: 2,
  },
  {
    id: 'tvc-003',
    code: '68FTD-TVL4018-FAI024-กม.9+250-มุ่งหน้าแยกไฟแดง',
    ipAddress: '10.83.8.9',
    stationType: 'Permanent',
    lanes: 6,
  },
]

export const getTrafficVolumeById = (
  id: string
): TrafficVolumeProject | undefined =>
  TRAFFIC_VOLUME_PROJECTS.find((p) => p.id === id)
