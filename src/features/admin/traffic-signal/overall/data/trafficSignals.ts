// Mock data — โครงการสัญญาณไฟจราจรในระบบ
// Used by the Traffic Signal screen (camera list + map markers + table).

import type { WarrantyStatusString } from '@/types/shared'

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'
export type SignalPhase = 3 | 4
export type OperatingMode = 'FixedTime' | 'Adaptive_ET' | 'Auto' | 'Flashing24Hr'

/** Shared phase color palette — used by the cycle donut, phase timing card,
 *  charts (24h volume, real-time bars), 7-day daily cards, and the summary
 *  table. Order corresponds to phase 1..N. Use `getPhaseColor(phase)` for
 *  bounds-safe access. */
export const PHASE_COLORS = ['#05F2DB', '#B2FF00', '#FCD116', '#FF7B00'] as const

export const getPhaseColor = (phase: number): string =>
  PHASE_COLORS[(phase - 1) % PHASE_COLORS.length]

/** Single phase timing config — used by the Phase Timing card + donut chart on
 *  the detail page. Sum of all phases' (green + red) = full cycle (e.g. 240s). */
export interface PhaseTimingConfig {
  /** Phase number (1–4) */
  phase: number
  /** Green-light duration (seconds) */
  greenSec: number
  /** Red-light duration before next phase (seconds) */
  redSec: number
  /** Whether this phase is the currently active one (green) per the live API.
   *  Exactly one phase should have this true at any time. Undefined on mock
   *  data — the component falls back to a local simulation in that case. */
  isActive?: boolean
  /** ISO timestamp at which this phase became active. Used to compute the
   *  elapsed time in this phase (now − timestamp) so the countdown survives
   *  page refresh / navigation. */
  timestamp?: string
}

export interface TrafficSignalProject {
  /** Solution id — same value used by `/traffic/details/{id}` and the rest
   *  of the solution-scoped detail endpoints. Comes from `solution.id` on
   *  the list endpoint. */
  id: string
  /** Project / contract entity id — used by `/manage/contract/{project_id}`
   *  (Project Info modal). Comes from `project.id` on the list endpoint. */
  projectId?: string
  /** Road entity id — used by `/manage/departments/by-road?road_id={road_id}`
   *  (resolves the responsible department in Project Info modal). Comes from
   *  `road.id` on the list endpoint. */
  roadId?: string
  /** รหัสสายทาง เช่น "กท.1001" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName: string
  /** จุดติดตั้ง */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  warranty: WarrantyStatus
  /** BE's authoritative warranty status — three states (ในค้ำ / หมดค้ำ / ก่อนค้ำ).
   *  Source for the detail-page warranty pill so the "ก่อนค้ำ" yellow state
   *  isn't lost behind the boolean `warranty` flag (which only encodes 2). */
  warrantyStatus?: WarrantyStatusString
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
  // ── Detail page metrics ─────────────────────────────────────────────────
  /** Anydesk ID shown in the title bar (e.g. "1194336831") */
  anydeskId?: string
  /** ประสิทธิภาพของระบบ (%) */
  efficiency?: number
  /** PCU ประจำวัน */
  dailyPCU?: number
  /** จำนวนรถในช่วงเร่งด่วน (peak hour) */
  peakHourTraffic?: number
  /** Phase ที่เป็น peak (เช่น 2 = "Phase 2 - Peak") */
  peakPhase?: number
  /** Phase timing config — array length = number of phases */
  phaseTiming?: PhaseTimingConfig[]
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
    anydeskId: '1153028471',
    efficiency: 85.3, dailyPCU: 12453, peakHourTraffic: 4500, peakPhase: 1,
    phaseTiming: [
      { phase: 1, greenSec: 70, redSec: 20 },
      { phase: 2, greenSec: 50, redSec: 20 },
      { phase: 3, greenSec: 60, redSec: 20 },
    ],
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
    anydeskId: '1248391552',
    efficiency: 0, dailyPCU: 0, peakHourTraffic: 0, peakPhase: 1,
    phaseTiming: [
      { phase: 1, greenSec: 60, redSec: 20 },
      { phase: 2, greenSec: 45, redSec: 20 },
      { phase: 3, greenSec: 55, redSec: 20 },
      { phase: 4, greenSec: 70, redSec: 10 },
    ],
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
    anydeskId: '1187234901',
    efficiency: 88.2, dailyPCU: 4520, peakHourTraffic: 15240, peakPhase: 3,
    phaseTiming: [
      { phase: 1, greenSec: 55, redSec: 20 },
      { phase: 2, greenSec: 45, redSec: 20 },
      { phase: 3, greenSec: 75, redSec: 20 },
      { phase: 4, greenSec: 65, redSec: 10 },
    ],
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
    anydeskId: '1194336831',
    efficiency: 86.9,
    dailyPCU: 5604,
    peakHourTraffic: 18676,
    peakPhase: 2,
    phaseTiming: [
      { phase: 1, greenSec: 60, redSec: 20 },
      { phase: 2, greenSec: 40, redSec: 20 },
      { phase: 3, greenSec: 60, redSec: 20 },
      { phase: 4, greenSec: 80, redSec: 10 },
    ],
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
    anydeskId: '1294582031',
    efficiency: 72.5, dailyPCU: 3210, peakHourTraffic: 8520, peakPhase: 2,
    phaseTiming: [
      { phase: 1, greenSec: 50, redSec: 20 },
      { phase: 2, greenSec: 65, redSec: 20 },
      { phase: 3, greenSec: 55, redSec: 20 },
    ],
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
    anydeskId: '1273918450',
    efficiency: 91.2, dailyPCU: 7820, peakHourTraffic: 22050, peakPhase: 4,
    phaseTiming: [
      { phase: 1, greenSec: 60, redSec: 20 },
      { phase: 2, greenSec: 50, redSec: 20 },
      { phase: 3, greenSec: 60, redSec: 20 },
      { phase: 4, greenSec: 90, redSec: 10 },
    ],
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
    anydeskId: '1156782301',
    efficiency: 78.5, dailyPCU: 2890, peakHourTraffic: 7240, peakPhase: 1,
    phaseTiming: [
      { phase: 1, greenSec: 65, redSec: 20 },
      { phase: 2, greenSec: 55, redSec: 20 },
      { phase: 3, greenSec: 50, redSec: 20 },
    ],
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
    anydeskId: '1119840562',
    efficiency: 0, dailyPCU: 0, peakHourTraffic: 0, peakPhase: 1,
    phaseTiming: [
      { phase: 1, greenSec: 60, redSec: 20 },
      { phase: 2, greenSec: 45, redSec: 20 },
      { phase: 3, greenSec: 60, redSec: 20 },
      { phase: 4, greenSec: 75, redSec: 10 },
    ],
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
