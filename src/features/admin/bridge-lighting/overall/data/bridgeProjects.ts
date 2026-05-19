// Mock data — โครงการไฟประดับสะพานในระบบ
// Used by the BridgeLighting screen (table + map markers).

export type WarrantyStatus = 'in-warranty' | 'expired'
export type ConnectionStatus = 'online' | 'offline'

export interface BridgeProject {
  id: string
  /** รหัสสายทาง เช่น "ชร.5051" */
  roadCode: string
  /** ชื่อโครงการเต็ม */
  projectName: string
  /** จุดติดตั้ง เช่น "ไฟประดับ : สะพานขัวพญามังราย" */
  installPoint: string
  /** เลขที่สัญญา เช่น "ขทช.ชร./49/2568" */
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  stream: boolean
  /** สำนัก (top-level org unit) — projects are grouped by this in the table.
   *  Examples: "ส่วนกลาง", "สทช.ที่ 17 เชียงราย", "สทช.ที่ 2 สระบุรี". */
  bureau: string
  /** [lng, lat] for map marker */
  coord: [number, number]
  // ── Counts for the summary view ───────────────────────────────────────────
  /** จำนวนดวงไฟทั้งหมดในโครงการ */
  totalDevices: number
  /** จำนวนที่ออนไลน์ */
  onlineCount: number
  /** จำนวนที่ออฟไลน์ */
  offlineCount: number
  // ── Detail page data ──────────────────────────────────────────────────────
  /** Anydesk remote-access ID for the control PC */
  anydesk: string
  /** สถานะการทำงานล่าสุด เช่น "เปิดไฟประดับสะพาน" / "ปิดไฟประดับสะพาน" */
  statusText: string
  /** Timestamp string of last update for status */
  lastUpdate: string
  /** Electrical readings — voltage per phase (V) */
  voltage: { avg: number; p1: number; p2: number; p3: number }
  /** Electrical readings — current per phase (A) */
  current: { total: number; p1: number; p2: number; p3: number }
}

/** Helper: lookup a single project by id (for detail page route param). */
export const getBridgeProjectById = (id: string): BridgeProject | undefined =>
  BRIDGE_PROJECTS.find((p) => p.id === id)

export const BRIDGE_PROJECTS: BridgeProject[] = [
  // ── ส่วนกลาง (สำนักก่อสร้างสะพาน — ดูแลสะพานหลัก กทม.) ──
  {
    id: 'br-003', roadCode: 'สะพานกรุงเทพ', bureau: 'ส่วนกลาง',
    projectName: 'จ้างก่อสร้างงานบำรุง โครงการปรับปรุงถนน สะพานกรุงเทพ เขตบางคอแหลม, ธนบุรี กรุงเทพมหานคร',
    installPoint: 'ไฟประดับ : สะพานกรุงเทพ ฝั่งธน',
    contractNo: 'สบร.49/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    coord: [100.510, 13.700],
    totalDevices: 11, onlineCount: 11, offlineCount: 0,
    anydesk: '1194336800', statusText: 'เปิดไฟประดับสะพาน',
    lastUpdate: '15 เม.ย. 2569 18:35:29 น.',
    voltage: { avg: 230.1, p1: 229, p2: 232, p3: 229 },
    current: { total: 13.5, p1: 4.5, p2: 4.6, p3: 4.4 },
  },
  {
    id: 'br-004', roadCode: 'สะพานกรุงเทพ', bureau: 'ส่วนกลาง',
    projectName: 'จ้างก่อสร้างงานบำรุง โครงการปรับปรุงถนน สะพานกรุงเทพ ฝั่งพระนคร เขตบางคอแหลม, ธนบุรี กรุงเทพมหานคร',
    installPoint: 'ไฟประดับ : สะพานกรุงเทพ ฝั่งพระนคร',
    contractNo: 'สบร.50/2568',
    warranty: 'in-warranty', connection: 'online', stream: true,
    coord: [100.515, 13.705],
    totalDevices: 27, onlineCount: 24, offlineCount: 3,
    anydesk: '1194336831', statusText: 'ปิดไฟประดับสะพาน',
    lastUpdate: '15 เม.ย. 2569 18:35:29 น.',
    voltage: { avg: 229.3, p1: 228, p2: 231, p3: 229 },
    current: { total: 14.8, p1: 4.8, p2: 5.1, p3: 4.9 },
  },
  {
    id: 'br-005', roadCode: 'สะพานพระปกเกล้า', bureau: 'ส่วนกลาง',
    projectName: 'โครงการจ้างก่อสร้างงานบำรุง สะพานพระปกเกล้า เขตคลองสาน, พระนคร จ.กรุงเทพมหานคร',
    installPoint: 'ไฟประดับ : สะพานพระปกเกล้า',
    contractNo: 'สบร.180/2567',
    warranty: 'expired', connection: 'offline', stream: false,
    coord: [100.501, 13.738],
    totalDevices: 23, onlineCount: 0, offlineCount: 23,
    anydesk: '1194336802', statusText: 'ปิดไฟประดับสะพาน',
    lastUpdate: '10 เม.ย. 2569 21:10:05 น.',
    voltage: { avg: 0, p1: 0, p2: 0, p3: 0 },
    current: { total: 0, p1: 0, p2: 0, p3: 0 },
  },

  // ── สทช.ที่ 17 เชียงราย (ครอบคลุม เชียงราย, พะเยา, แพร่, น่าน) ──
  {
    id: 'br-001', roadCode: 'ชร.5051', bureau: 'สทช.ที่ 17 เชียงราย',
    projectName: 'งานไฟฟ้าแสงสว่างและไฟสัญญาณจราจร ถนนสาย ชร.5051 สาย ค.3 ถนนผังเมืองรวมเชียงราย อ.เมืองเชียงราย จ.เชียงราย',
    installPoint: 'ไฟประดับ : สะพานขัวพญามังราย',
    contractNo: 'ขทช.ชร./49/2568',
    warranty: 'expired', connection: 'offline', stream: false,
    coord: [99.840, 19.910],
    totalDevices: 76, onlineCount: 0, offlineCount: 76,
    anydesk: '1194336803', statusText: 'ปิดไฟประดับสะพาน',
    lastUpdate: '08 เม.ย. 2569 12:00:00 น.',
    voltage: { avg: 0, p1: 0, p2: 0, p3: 0 },
    current: { total: 0, p1: 0, p2: 0, p3: 0 },
  },

  // ── สทช.ที่ 2 สระบุรี (ครอบคลุม สระบุรี, ลพบุรี, สิงห์บุรี, อ่างทอง) ──
  {
    id: 'br-002', roadCode: 'สห.3026', bureau: 'สทช.ที่ 2 สระบุรี',
    projectName: 'งานบำรุงถนนสาย สห.3026 แยกทางหลวงหมายเลข 311 - แยกทางหลวงหมายเลข 3030 อ.เมือง จ.สิงห์บุรี',
    installPoint: 'ไฟประดับ : สายทาง สห.3026',
    contractNo: 'ขทช.สห./42/2568',
    warranty: 'expired', connection: 'online', stream: true,
    coord: [100.395, 14.891],
    totalDevices: 42, onlineCount: 42, offlineCount: 0,
    anydesk: '1194336804', statusText: 'เปิดไฟประดับสะพาน',
    lastUpdate: '14 เม.ย. 2569 19:30:11 น.',
    voltage: { avg: 228.7, p1: 227, p2: 230, p3: 229 },
    current: { total: 18.2, p1: 6.1, p2: 6.0, p3: 6.1 },
  },
]
