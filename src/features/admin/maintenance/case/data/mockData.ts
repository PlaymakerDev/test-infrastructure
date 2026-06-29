export type RepairStatus = 'pending' | 'in_progress' | 'completed'
export type WarrantyStatus = 'active' | 'expired'

export interface ProjectInfo {
  projectName: string
  contractor: string
  agency: string
  contractNo: string
  warrantyStart: string
  warrantyEnd: string
  warrantyStatus: WarrantyStatus
}

export interface DeviceInfo {
  deviceName: string
  deviceType: string
  installPoint: string
  ipAddress: string
  offlineDate: string
  offlineDays: number
  hasLive: boolean
}

export interface CaseFormData {
  category: string
  agency: string
  problem: string
  solution: string
  reportDate: string
  inspectDate: string
  beforeImages: number
  afterImages: number
}

export interface CaseMockData {
  repairStatus: RepairStatus
  problemCategory: string
  project: ProjectInfo
  device: DeviceInfo
  form: CaseFormData
}

export const REPAIR_STATUS_CONFIG: Record<RepairStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'ยังไม่มีการตรวจเช็ค', color: '#E94C4C', bg: '#E94C4C1A' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#66AEFF', bg: '#66AEFF1A' },
  completed: { label: 'เสร็จสิ้น', color: '#66AEFF', bg: '#66AEFF33' },
}

export const DEFAULT_CASE_DATA: CaseMockData = {
  repairStatus: 'pending',
  problemCategory: 'ยังไม่ระบุ',
  project: {
    projectName: 'ไม่พบข้อมูลโครงการ',
    contractor: '-',
    agency: '-',
    contractNo: '-',
    warrantyStart: '-',
    warrantyEnd: '-',
    warrantyStatus: 'expired',
  },
  device: {
    deviceName: 'ไม่พบข้อมูลอุปกรณ์',
    deviceType: '-',
    installPoint: '-',
    ipAddress: '-',
    offlineDate: '-',
    offlineDays: 0,
    hasLive: false,
  },
  form: {
    category: '',
    agency: '',
    problem: '',
    solution: '',
    reportDate: '',
    inspectDate: '',
    beforeImages: 0,
    afterImages: 0,
  },
}

export const CASE_MOCK: Record<string, CaseMockData> = {
  'C-20260331-0050': {
    repairStatus: 'pending',
    problemCategory: 'ยังไม่ระบุ',
    project: {
      projectName: 'GS - CCTV+AI สะพานสมเด็จพระเจ้าตากสินมหาราช เขตคลองสาน, สาทร, บางรัก กทม.',
      contractor: 'FTD',
      agency: 'บทช.กัลปพฤกษ์',
      contractNo: 'สบธ.88/2566',
      warrantyStart: '22 ก.พ. 2566',
      warrantyEnd: '22 มิ.ย. 2568',
      warrantyStatus: 'expired',
    },
    device: {
      deviceName: 'DRR-TS-BulletCAM08 – ฝั่งพระนคร',
      deviceType: 'CCTV',
      installPoint: 'สะพานตากสิน',
      ipAddress: '192.168.3.170',
      offlineDate: '26 ก.พ. 2569',
      offlineDays: 20,
      hasLive: true,
    },
    form: { category: '', agency: '', problem: '', solution: '', reportDate: '', inspectDate: '', beforeImages: 0, afterImages: 0 },
  },
  'C-20260330-0012': {
    repairStatus: 'in_progress',
    problemCategory: 'กล้องเสีย',
    project: {
      projectName: 'GS - CCTV ถนนกัลปพฤกษ์ เขตบางแค กทม.',
      contractor: 'Firsttech Design Co., Ltd.',
      agency: 'สทช. 1 (ปทุมธานี)',
      contractNo: 'สบธ.45/2567',
      warrantyStart: '10 ม.ค. 2567',
      warrantyEnd: '10 ม.ค. 2570',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-KP-CCTV01 – ฝั่งธนบุรี',
      deviceType: 'AI Camera',
      installPoint: 'ถนนกัลปพฤกษ์',
      ipAddress: '192.168.5.101',
      offlineDate: '15 มี.ค. 2569',
      offlineDays: 5,
      hasLive: false,
    },
    form: {
      category: 'cctv',
      agency: 'agency_2',
      problem: 'กล้องไม่สามารถจับภาพได้ หน้าจอดำสนิท',
      solution: 'เปลี่ยนกล้องตัวใหม่และตั้งค่า IP ใหม่',
      reportDate: '10 เม.ย. 2569',
      inspectDate: '12 เม.ย. 2569',
      beforeImages: 2,
      afterImages: 1,
    },
  },
  'C-20260329-0088': {
    repairStatus: 'completed',
    problemCategory: 'ไฟส่องสว่าง',
    project: {
      projectName: 'GS - Traffic Lighting ถนนพระราม 2 เขตบางขุนเทียน กทม.',
      contractor: 'ABC Engineering',
      agency: 'สทช. 2 (นนทบุรี)',
      contractNo: 'สบธ.12/2565',
      warrantyStart: '1 เม.ย. 2565',
      warrantyEnd: '1 เม.ย. 2568',
      warrantyStatus: 'expired',
    },
    device: {
      deviceName: 'DRR-RL-LIGHT05 – ขาออก',
      deviceType: 'Traffic Light',
      installPoint: 'พระราม 2',
      ipAddress: '192.168.10.50',
      offlineDate: '1 ม.ค. 2569',
      offlineDays: 45,
      hasLive: true,
    },
    form: {
      category: 'traffic_lighting',
      agency: 'agency_3',
      problem: 'ไฟส่องสว่างดับหลายจุด บริเวณทางขึ้นสะพาน',
      solution: 'เปลี่ยนหลอด LED ใหม่ 5 จุด ตรวจสอบสายไฟ',
      reportDate: '5 ม.ค. 2569',
      inspectDate: '8 ม.ค. 2569',
      beforeImages: 3,
      afterImages: 2,
    },
  },
  'C-20260328-0015': {
    repairStatus: 'pending',
    problemCategory: 'ยังไม่ระบุ',
    project: {
      projectName: 'GS - VMS ทางด่วนเฉลิมมหานคร เขตคลองเตย กทม.',
      contractor: 'XYZ Technology',
      agency: 'สทช. 3 (สมุทรปราการ)',
      contractNo: 'สบธ.99/2566',
      warrantyStart: '15 ส.ค. 2566',
      warrantyEnd: '15 ส.ค. 2569',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-EX-VMS01 – ขาเข้า',
      deviceType: 'VMS',
      installPoint: 'ทางด่วนเฉลิมมหานคร',
      ipAddress: '192.168.20.10',
      offlineDate: '',
      offlineDays: 0,
      hasLive: true,
    },
    form: { category: '', agency: '', problem: '', solution: '', reportDate: '', inspectDate: '', beforeImages: 0, afterImages: 0 },
  },
  'C-20260327-0042': {
    repairStatus: 'in_progress',
    problemCategory: 'Network',
    project: {
      projectName: 'GS - Network ถนนราชพฤกษ์ เขตภาษีเจริญ กทม.',
      contractor: 'Net Solutions',
      agency: 'บทช.กัลปพฤกษ์',
      contractNo: 'สบธ.33/2567',
      warrantyStart: '1 ก.ย. 2567',
      warrantyEnd: '1 ก.ย. 2570',
      warrantyStatus: 'active',
    },
    device: {
      deviceName: 'DRR-RP-SW01 – ตู้หลัก',
      deviceType: 'Switch',
      installPoint: 'ถนนราชพฤกษ์',
      ipAddress: '192.168.1.1',
      offlineDate: '20 พ.ค. 2569',
      offlineDays: 10,
      hasLive: false,
    },
    form: {
      category: 'incident_detection',
      agency: 'agency_1',
      problem: 'Switch หลักไม่ตอบสนอง อุปกรณ์ทั้งหมดออฟไลน์',
      solution: 'รีบูต Switch และอัพเดท Firmware',
      reportDate: '15 พ.ค. 2569',
      inspectDate: '18 พ.ค. 2569',
      beforeImages: 1,
      afterImages: 0,
    },
  },
}
