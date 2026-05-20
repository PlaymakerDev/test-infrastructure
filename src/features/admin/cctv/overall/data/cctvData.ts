export type ConnectionStatus = 'online' | 'offline'
export type WarrantyStatus = 'in-warranty' | 'expired'

export interface CctvProvinceCluster {
  id: string
  name: string
  count: number
  coord: [number, number] // [lng, lat]
}

export interface CctvCamera {
  id: string
  name: string
  ip: string
  online: boolean
  warrantyStatus: WarrantyStatus
  provinceId: string
  hlsUrl?: string
}

export const CCTV_PROVINCE_CLUSTERS: CctvProvinceCluster[] = [
  { id: 'cr', name: 'เชียงราย',         count: 127,  coord: [99.8832,  19.9105] },
  { id: 'cn', name: 'เชียงใหม่',         count: 291,  coord: [98.9853,  18.7883] },
  { id: 'ph', name: 'พิษณุโลก',          count: 236,  coord: [100.2659, 16.8211] },
  { id: 'ns', name: 'นครสวรรค์',         count: 203,  coord: [100.1333, 15.6987] },
  { id: 'ud', name: 'อุดรธานี',          count: 128,  coord: [102.7853, 17.4138] },
  { id: 'sk', name: 'สกลนคร',            count: 59,   coord: [104.1453, 17.1554] },
  { id: 'nm', name: 'นครพนม',            count: 59,   coord: [104.7720, 17.3928] },
  { id: 'lp', name: 'ลพบุรี',            count: 36,   coord: [100.6536, 14.7995] },
  { id: 'kk', name: 'ขอนแก่น',          count: 294,  coord: [102.8347, 16.4419] },
  { id: 'sb', name: 'สระบุรี',           count: 84,   coord: [100.9112, 14.5289] },
  { id: 'nr', name: 'นครราชสีมา',        count: 426,  coord: [102.0978, 14.9799] },
  { id: 'bk', name: 'กรุงเทพมหานคร',    count: 528,  coord: [100.5018, 13.7563] },
  { id: 'sa', name: 'สระแก้ว',           count: 179,  coord: [102.0694, 13.8235] },
  { id: 'cb', name: 'ชลบุรี',            count: 279,  coord: [100.9925, 13.3619] },
  { id: 'sr', name: 'สุรินทร์',          count: 37,   coord: [103.4937, 14.8825] },
  { id: 'rb', name: 'ระยอง',             count: 140,  coord: [101.2787, 12.6836] },
  { id: 'su', name: 'สุราษฎร์ธานี',     count: 140,  coord: [99.3227,   9.1382] },
  { id: 'nk', name: 'นครศรีธรรมราช',    count: 62,   coord: [99.9631,   8.4322] },
  { id: 'sg', name: 'สงขลา',             count: 128,  coord: [100.5975,  7.1756] },
  // additional provinces to reach total ~9128
  { id: 'pt', name: 'ปทุมธานี',          count: 312,  coord: [100.5300, 14.0208] },
  { id: 'ay', name: 'อยุธยา',            count: 287,  coord: [100.5877, 14.3533] },
  { id: 'nw', name: 'นนทบุรี',          count: 248,  coord: [100.5255, 13.8591] },
  { id: 'sm', name: 'สมุทรปราการ',       count: 321,  coord: [100.5996, 13.5990] },
  { id: 'rn', name: 'ราชบุรี',           count: 196,  coord: [99.8161,  13.5361] },
  { id: 'pn', name: 'เพชรบุรี',          count: 143,  coord: [99.9433,  13.1119] },
  { id: 'pr', name: 'ประจวบคีรีขันธ์',  count: 112,  coord: [99.7979,  11.8126] },
  { id: 'cm', name: 'ชุมพร',             count: 89,   coord: [99.1800,  10.4930] },
  { id: 'rg', name: 'ระนอง',             count: 67,   coord: [98.6388,  9.9528]  },
  { id: 'kn', name: 'กระบี่',            count: 94,   coord: [99.0520,  8.0863]  },
  { id: 'pkt', name: 'ภูเก็ต',           count: 178,  coord: [98.3923,  7.9519]  },
  { id: 'pn2', name: 'พังงา',            count: 76,   coord: [98.5277,  8.4509]  },
  { id: 'tr', name: 'ตรัง',              count: 88,   coord: [99.6127,  7.5593]  },
  { id: 'st2', name: 'สตูล',             count: 54,   coord: [100.0671, 6.6246]  },
  { id: 'yt', name: 'ยะลา',              count: 71,   coord: [101.2813, 6.5352]  },
  { id: 'nb', name: 'นราธิวาส',          count: 63,   coord: [101.8231, 6.4254]  },
  { id: 'pt2', name: 'ปัตตานี',          count: 58,   coord: [101.2677, 6.8696]  },
]

// Sample cameras for the left preview panel
export const SAMPLE_CCTV_CAMERAS: CctvCamera[] = [
  {
    id: 'cam001',
    name: 'DRR-SR6048-CAM20 - กม.0+550',
    ip: '192.168.30.119',
    online: true,
    warrantyStatus: 'in-warranty',
    provinceId: 'sa',
  },
  {
    id: 'cam002',
    name: '68MST-PYO1042-FAI017-จุดที่5-กม.04+180-มุ่งหน้าเขาน้ำโห้วย',
    ip: '10.172.26.17',
    online: true,
    warrantyStatus: 'in-warranty',
    provinceId: 'ph',
  },
  {
    id: 'cam003',
    name: '69PSD-NMA1111-FAI001-จุดที่1-กม.0+400-มุ่งหน้าถนนบัตรภาพท้ายรก',
    ip: '10.101.27.1',
    online: false,
    warrantyStatus: 'expired',
    provinceId: 'nr',
  },
]

export const CCTV_STATS = {
  total: 9128,
  totalActive: 6235,
  inWarranty: 6026,
  inWarrantyActive: 5193,
  expired: 3102,
  expiredActive: 1932,
}

// ── Table data (route/saiTang level, grouped by bureau) ────────────────────

export interface CctvCameraEntry {
  id: string
  /** รหัสสายทาง */
  roadCode: string
  /** ชื่อสาย/โครงการ */
  projectName: string
  /** จุดติดตั้ง (ลิงก์ไปหน้า detail) */
  installPoint: string
  /** เลขที่สัญญา */
  contractNo: string
  warranty: WarrantyStatus
  connection: ConnectionStatus
  /** สำนัก — ใช้จัดกลุ่มในตาราง */
  bureau: string
  coord: [number, number]
  totalCameras: number
  onlineCount: number
  offlineCount: number
  ip: string
}

export const getCctvCameraEntryById = (id: string): CctvCameraEntry | undefined =>
  CCTV_CAMERAS.find((c) => c.id === id)

// ── Install-point detail ───────────────────────────────────────────────────────

export interface CctvInstallPin {
  id: string
  coord: [number, number]
  online: boolean
}

export interface PanelCamera {
  id: string
  name: string
  ip: string
  online: boolean
  hlsUrl?: string
  functions?: string[]
}

export interface CctvInstallDetail {
  id: string
  roadCode: string
  title: string
  location: string
  projectName: string
  contractNo: string
  warrantyStatus: WarrantyStatus
  googleMapUrl?: string
  coord: [number, number]
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  pins: CctvInstallPin[]
  cameras: PanelCamera[]
}

const MOCK_INSTALL_DETAIL: CctvInstallDetail = {
  id: 'cc-001',
  roadCode: 'ฉช.3001',
  title: 'สายทาง ฉช.3001',
  location: 'ฉช.3001 แยกเกาะไร่ กม.7+900',
  projectName: 'ระบบกล้อง CCTV สี่แยกเกาะไร่ จ.ฉะเชิงเทรา',
  contractNo: 'ขทช.ฉช./08/2568',
  warrantyStatus: 'in-warranty',
  coord: [101.077, 13.690],
  totalCameras: 8,
  onlineCameras: 7,
  offlineCameras: 1,
  pins: [
    { id: 'p1', coord: [101.075, 13.693], online: true  },
    { id: 'p2', coord: [101.079, 13.688], online: false },
    { id: 'p3', coord: [101.074, 13.691], online: true  },
    { id: 'p4', coord: [101.078, 13.692], online: true  },
    { id: 'p5', coord: [101.075, 13.689], online: true  },
    { id: 'p6', coord: [101.080, 13.691], online: true  },
    { id: 'p7', coord: [101.077, 13.687], online: true  },
    { id: 'p8', coord: [101.076, 13.694], online: true  },
  ],
  cameras: [
    { id: 'det001', name: '68MST-CCO3001-FAI001-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าลาดกระบัง', ip: '10.101.27.1', online: true,  functions: ['CCTV', 'Incident'] },
    { id: 'det002', name: '68MST-CCO3001-FAI002-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าแยกท่า',   ip: '10.101.27.2', online: false, functions: ['CCTV'] },
    { id: 'det003', name: '68MST-CCO3001-FAI003-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้านานา',     ip: '10.101.27.3', online: true,  functions: ['CCTV', 'Volume', 'Traffic'] },
    { id: 'det004', name: '68MST-CCO3001-FAI004-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าเข้าเมือง', ip: '10.101.27.4', online: true,  functions: ['CCTV'] },
    { id: 'det005', name: '68MST-CCO3001-FAI005-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าบ้านโพธิ์', ip: '10.101.27.5', online: true,  functions: ['CCTV', 'Volume'] },
    { id: 'det006', name: '68MST-CCO3001-FAI006-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าหวัน',     ip: '10.101.27.6', online: true,  functions: ['CCTV', 'Incident'] },
    { id: 'det007', name: '68MST-CCO3001-FAI007-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้านนทบุรี',  ip: '10.101.27.7', online: true,  functions: ['CCTV', 'Incident'] },
    { id: 'det008', name: '68MST-CCO3001-FAI008-จรารสี่แยกเกาะไร่-กม.7+900-มุ่งหน้าออกเมือง', ip: '10.101.27.8', online: true,  functions: ['CCTV'] },
  ],
}

export const getCctvInstallDetailById = (id: string): CctvInstallDetail =>
  ({ ...MOCK_INSTALL_DETAIL, id })

export const CCTV_CAMERAS: CctvCameraEntry[] = [
  // ── ส่วนกลาง ──────────────────────────────────────────────────────────────
  {
    id: 'cc-001', roadCode: 'กท.001', bureau: 'ส่วนกลาง',
    projectName: 'ระบบกล้อง CCTV ถนนวิภาวดีรังสิต กรุงเทพมหานคร',
    installPoint: 'DRR-BK-VPR-CAM01 - กม.0+000 ถึง กม.3+500',
    contractNo: 'สทช.กท./12/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [100.5537, 13.8435], totalCameras: 24, onlineCount: 22, offlineCount: 2,
    ip: '192.168.1.10',
  },
  {
    id: 'cc-002', roadCode: 'กท.002', bureau: 'ส่วนกลาง',
    projectName: 'ระบบกล้อง CCTV ถนนพหลโยธิน กรุงเทพมหานคร',
    installPoint: 'DRR-BK-PHY-CAM01 - กม.0+000 ถึง กม.5+200',
    contractNo: 'สทช.กท./13/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [100.5436, 13.8651], totalCameras: 32, onlineCount: 30, offlineCount: 2,
    ip: '192.168.1.20',
  },
  {
    id: 'cc-003', roadCode: 'กท.003', bureau: 'ส่วนกลาง',
    projectName: 'ระบบกล้อง CCTV ถนนรัตนาธิเบศร์ นนทบุรี',
    installPoint: 'DRR-BK-RAT-CAM01 - กม.0+000 ถึง กม.2+800',
    contractNo: 'สทช.กท./14/2567',
    warranty: 'expired', connection: 'offline',
    coord: [100.5255, 13.8591], totalCameras: 18, onlineCount: 0, offlineCount: 18,
    ip: '192.168.1.30',
  },

  // ── สทช.ที่ 1 เชียงใหม่ ────────────────────────────────────────────────────
  {
    id: 'cc-004', roadCode: 'ชม.1001', bureau: 'สทช.ที่ 1 เชียงใหม่',
    projectName: 'ระบบกล้อง CCTV ถนนซุปเปอร์ไฮเวย์ เชียงใหม่-ลำพูน',
    installPoint: 'DRR-CM-SHW-CAM01 - กม.0+000 ถึง กม.8+000',
    contractNo: 'ขทช.ชม./28/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [98.9853, 18.7883], totalCameras: 40, onlineCount: 38, offlineCount: 2,
    ip: '10.10.1.10',
  },
  {
    id: 'cc-005', roadCode: 'ชม.1002', bureau: 'สทช.ที่ 1 เชียงใหม่',
    projectName: 'ระบบกล้อง CCTV ถนนโชตนา จ.เชียงใหม่',
    installPoint: 'DRR-CM-CHT-CAM01 - กม.0+000 ถึง กม.4+600',
    contractNo: 'ขทช.ชม./29/2567',
    warranty: 'expired', connection: 'online',
    coord: [98.9750, 18.8200], totalCameras: 22, onlineCount: 20, offlineCount: 2,
    ip: '10.10.1.20',
  },

  // ── สทช.ที่ 4 ขอนแก่น ─────────────────────────────────────────────────────
  {
    id: 'cc-006', roadCode: 'ขก.4001', bureau: 'สทช.ที่ 4 ขอนแก่น',
    projectName: 'ระบบกล้อง CCTV ถนนมิตรภาพ ขอนแก่น-โคราช',
    installPoint: 'DRR-KK-MPH-CAM01 - กม.0+000 ถึง กม.12+000',
    contractNo: 'ขทช.ขก./35/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [102.8347, 16.4419], totalCameras: 56, onlineCount: 52, offlineCount: 4,
    ip: '10.20.1.10',
  },
  {
    id: 'cc-007', roadCode: 'ขก.4002', bureau: 'สทช.ที่ 4 ขอนแก่น',
    projectName: 'ระบบกล้อง CCTV ถนนสาย ขก.4002 อ.เมือง จ.ขอนแก่น',
    installPoint: 'DRR-KK-4002-CAM01 - กม.0+000 ถึง กม.6+400',
    contractNo: 'ขทช.ขก./36/2567',
    warranty: 'expired', connection: 'offline',
    coord: [102.8150, 16.4200], totalCameras: 28, onlineCount: 0, offlineCount: 28,
    ip: '10.20.1.20',
  },
  {
    id: 'cc-008', roadCode: 'นม.4003', bureau: 'สทช.ที่ 4 ขอนแก่น',
    projectName: 'ระบบกล้อง CCTV ถนนราชสีมา-โชคชัย จ.นครราชสีมา',
    installPoint: 'DRR-NM-RCM-CAM01 - กม.0+000 ถึง กม.9+800',
    contractNo: 'ขทช.นม./41/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [102.0978, 14.9799], totalCameras: 48, onlineCount: 45, offlineCount: 3,
    ip: '10.20.1.30',
  },

  // ── สทช.ที่ 11 สุราษฎร์ธานี ────────────────────────────────────────────────
  {
    id: 'cc-009', roadCode: 'สฎ.11001', bureau: 'สทช.ที่ 11 สุราษฎร์ธานี',
    projectName: 'ระบบกล้อง CCTV ถนนเอเชีย สายใต้ สุราษฎร์ธานี-นครศรีธรรมราช',
    installPoint: 'DRR-ST-ASA-CAM01 - กม.0+000 ถึง กม.15+000',
    contractNo: 'ขทช.สฎ./22/2568',
    warranty: 'in-warranty', connection: 'online',
    coord: [99.3227, 9.1382], totalCameras: 62, onlineCount: 58, offlineCount: 4,
    ip: '10.30.1.10',
  },
  {
    id: 'cc-010', roadCode: 'สฎ.11002', bureau: 'สทช.ที่ 11 สุราษฎร์ธานี',
    projectName: 'ระบบกล้อง CCTV ถนนสายใต้เก่า สุราษฎร์ธานี',
    installPoint: 'DRR-ST-OLD-CAM01 - กม.0+000 ถึง กม.7+200',
    contractNo: 'ขทช.สฎ./23/2567',
    warranty: 'expired', connection: 'offline',
    coord: [99.3100, 9.1200], totalCameras: 30, onlineCount: 0, offlineCount: 30,
    ip: '10.30.1.20',
  },
]
