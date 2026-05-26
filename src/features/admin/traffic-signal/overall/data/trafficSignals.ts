// Mock data — โครงการสัญญาณไฟจราจรในระบบ
// Used by the Traffic Signal screen (camera list + map markers + table).

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type SignalPhase = 3 | 4
export type OperatingMode = 'FixedTime' | 'Adaptive_ET' | 'Flashing24Hr'

export interface TrafficSignalProject {
  id: string
  /** รหัสสายทาง เช่น "กท.1001" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName: string
  /** จุดติดตั้ง */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  stream: boolean
  phase: SignalPhase
  operatingMode: OperatingMode
  /** สำนัก (top-level org unit) — projects are grouped by this in the table. */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  // ── Counts for the summary view (crosswalk-style table) ─────────────────
  /** จำนวนกล้องทั้งหมดในโครงการ */
  totalCameras: number
  /** จำนวนกล้องที่ออนไลน์ */
  onlineCameras: number
  /** จำนวนกล้องที่ออฟไลน์ */
  offlineCameras: number
}

export const TRAFFIC_SIGNAL_PROJECTS: TrafficSignalProject[] = [
  // ── ส่วนกลาง ─────────────────────────────────────────────────────────────
  {
    id: 'ts-001', roadCode: 'กท.1001', bureau: 'ส่วนกลาง',
    projectName: 'โครงการเพิ่มประสิทธิภาพเพื่อความปลอดภัย ถนนสาย กท.1001 ถนนกัลปพฤกษ์ อ.บางแค จ.กรุงเทพมหานคร',
    installPoint: 'กท.1001 แยกจราจรบางพฤกษ์',
    contractNo: 'สอป.18/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    phase: 3, operatingMode: 'FixedTime',
    coord: [100.430, 13.720],
    totalCameras: 76, onlineCameras: 72, offlineCameras: 4,
  },

  // ── สทช.1 ปทุมธานี ───────────────────────────────────────────────────────
  {
    id: 'ts-002', roadCode: 'ปท.3010', bureau: 'สทช.1 ปทุมธานี',
    projectName: 'โครงการงานอำนวยความปลอดภัยและปรับปรุงแก้ไขบริเวณเสี่ยงอันตราย ติดตั้งสัญญาณไฟจราจรสาย ปท.3010',
    installPoint: 'จราจร >> จุดที่2 ตำบล คลองค่า อำเภอคลองหลวง ปทุมธานี 12120',
    contractNo: 'คค0709/32/2564',
    warranty: 'expired', connection: 'offline', stream: false,
    phase: 4, operatingMode: 'Adaptive_ET',
    coord: [100.620, 14.020],
    totalCameras: 42, onlineCameras: 0, offlineCameras: 42,
  },

  // ── สทช.13 ฉะเชิงเทรา ────────────────────────────────────────────────────
  {
    id: 'ts-003', roadCode: 'ฉช.3001', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'งานอำนวยความปลอดภัย ถนนสาย ฉช.3001 แยกทางหลวงหมายเลข 314 - บ้านลาดกระบัง (ตอนฉะเชิงเทรา) อ.บ้านโพธิ์ จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.3001 แยกจราจรเกาะไร่ กม.7+900',
    contractNo: 'สทช.13/67/2565',
    warranty: 'expired', connection: 'online', stream: true,
    phase: 4, operatingMode: 'Adaptive_ET',
    coord: [101.080, 13.685],
    totalCameras: 23, onlineCameras: 23, offlineCameras: 0,
  },
  {
    id: 'ts-004', roadCode: 'ฉช.4050', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'จ้างก่อสร้างโครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ฉช.4050 แยกทางหลวงหมายเลข 3200 - บ้านบางขนาก อ.เมืองฉะเชิงเทรา จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.4050 จุดที่ 6 กม.5+680',
    contractNo: 'สอป.67/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    phase: 4, operatingMode: 'Adaptive_ET',
    coord: [101.060, 13.700],
    totalCameras: 11, onlineCameras: 11, offlineCameras: 0,
  },
  {
    id: 'ts-005', roadCode: 'ฉช.4050', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'จ้างก่อสร้างโครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ฉช.4050 แยกทางหลวงหมายเลข 3200 - บ้านบางขนาก อ.เมืองฉะเชิงเทรา จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.4050 จุดที่ 8 กม.8+786',
    contractNo: 'สอป.68/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    phase: 3, operatingMode: 'Flashing24Hr',
    coord: [101.070, 13.715],
    totalCameras: 27, onlineCameras: 24, offlineCameras: 3,
  },
  {
    id: 'ts-006', roadCode: 'ฉช.4050', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'จ้างก่อสร้างโครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ฉช.4050 แยกทางหลวงหมายเลข 3200 - บ้านบางขนาก อ.เมืองฉะเชิงเทรา จ.ฉะเชิงเทรา',
    installPoint: 'ฉช.4050 จุดที่ 12 กม.12+450',
    contractNo: 'สอป.69/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    phase: 4, operatingMode: 'Adaptive_ET',
    coord: [101.075, 13.730],
    totalCameras: 56, onlineCameras: 52, offlineCameras: 4,
  },
  {
    id: 'ts-007', roadCode: 'ฉช.3204', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'งานปรับปรุงสัญญาณไฟจราจร ฉช.3204',
    installPoint: 'ฉช.3204 แยกบ้านโพธิ์',
    contractNo: 'สทช.13/72/2566',
    warranty: 'in-warranty', connection: 'online', stream: true,
    phase: 3, operatingMode: 'FixedTime',
    coord: [101.150, 13.690],
    totalCameras: 14, onlineCameras: 14, offlineCameras: 0,
  },
  {
    id: 'ts-008', roadCode: 'ฉช.2002', bureau: 'สทช.13 ฉะเชิงเทรา',
    projectName: 'โครงการติดตั้งระบบควบคุมสัญญาณไฟจราจร ฉช.2002',
    installPoint: 'ฉช.2002 แยกบางคล้า',
    contractNo: 'สทช.13/80/2566',
    warranty: 'expired', connection: 'offline', stream: false,
    phase: 4, operatingMode: 'FixedTime',
    coord: [101.205, 13.720],
    totalCameras: 18, onlineCameras: 0, offlineCameras: 18,
  },
]

/** CCTV camera previews shown in the left rail. Decoupled from the table
 *  data because the actual stream URL + framing is per camera, not per
 *  road project. */
export interface TrafficSignalCamera {
  id: string
  /** Display code, e.g. "684M-SPK2001-FAI003-กม.6+350-มุ่งหน้า KING POWER Srivaree" */
  code: string
  /** IP address shown below the code */
  ipAddress: string
  /** Number of signal phases controlled */
  phase: SignalPhase
  /** Detection mode label */
  detectionMode: 'Counting' | 'Stopline'
}

export const TRAFFIC_SIGNAL_CAMERAS: TrafficSignalCamera[] = [
  {
    id: 'cam-001',
    code: '684M-SPK2001-FAI003-กม.6+350-มุ่งหน้า KING POWER Srivaree',
    ipAddress: '10.12.7.3',
    phase: 3,
    detectionMode: 'Counting',
  },
  {
    id: 'cam-002',
    code: '69MST-RET3073-TF012-จราจรจุด2-กม.0+350-ส่องช่ายแยก',
    ipAddress: '10.12.2.1',
    phase: 4,
    detectionMode: 'Stopline',
  },
  {
    id: 'cam-003',
    code: '68FTD-UTI4018-FAI024-จราจร-กม.9+250-มุ่งหน้าแยกไฟแดง',
    ipAddress: '10.83.8.8',
    phase: 4,
    detectionMode: 'Stopline',
  },
]

/** Helper: lookup by id (mirrors the bridge-lighting pattern). */
export const getTrafficSignalById = (
  id: string
): TrafficSignalProject | undefined =>
  TRAFFIC_SIGNAL_PROJECTS.find((p) => p.id === id)
