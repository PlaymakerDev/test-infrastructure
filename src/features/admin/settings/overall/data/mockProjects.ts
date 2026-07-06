import type { Project } from '../types/project'

// Placeholder data — replace with API once /api-v2/manage/projects endpoints
// are ready. Kept small and realistic so the table/filters demo end-to-end.
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-001',
    code: 'tpj-0001',
    name: 'โครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย ขก.1027 แยกทางหลวงหมายเลข 2 - บ้านโคกท่า อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
    budgetYear: 2568,
    contractNo: 'ขทช.ขก/53/2568',
    contractor: 'กิจการค้าร่วม ทีพีเอส',
    owner: 'ขทช.ขอนแก่น',
    roads: [
      { id: 'r-1027', code: 'ขก.1027' },
      { id: 'r-1039', code: 'ขก.1039' },
    ],
    warrantyStart: '2026-06-07',
    warrantyEnd: '2028-08-06',
    warrantyStatus: 'delivering',
  },
  {
    id: 'p-002',
    code: 'tic-0009',
    name: 'เพิ่มประสิทธิภาพความปลอดภัย ถนนสาย ขก.4008 แยกทางหลวงหมายเลข 2062 - บ้านเหล่านาดี อำเภอมัญจาคีรี, พระยืน, เมืองขอนแก่น จังหวัดขอนแก่น',
    budgetYear: 2568,
    contractNo: 'สทช.ที่ 6/052/2568',
    contractor: 'กิจการค้าร่วม ทีไอซี',
    owner: 'ขทช.ขอนแก่น',
    roads: [{ id: 'r-4008', code: 'ขก.4008' }],
    warrantyStart: '2566-09-27',
    warrantyEnd: '2568-10-27',
    warrantyStatus: 'expired',
  },
  {
    id: 'p-003',
    code: '-',
    name: 'CCTV นย.3006 ยกล.305 - บ้านคลองหกวา อ.องครักษ์ จ.นครนายก',
    budgetYear: 2569,
    contractNo: 'WC2021-0012',
    contractor: 'เค.เอ็น.วี.อินเตอร์เทรด',
    owner: 'ขทช.นครนายก',
    roads: [{ id: 'r-3006', code: 'นย.3006' }],
    warrantyStart: '2569-01-07',
    warrantyEnd: '2571-02-06',
    warrantyStatus: 'in-warranty',
  },
  {
    id: 'p-004',
    code: 'twp-0007',
    name: 'เพิ่มประสิทธิภาพความปลอดภัย ถนนสาย ฉช.3001 แยกทางหลวงหมายเลข 314 - บ้านลาดกระบัง (ตอน สมุทรปราการ) อำเภอบางบ่อ จังหวัดสมุทรปราการ',
    budgetYear: 2569,
    contractNo: 'สทช.ที่ 1 (ปทุมธานี)',
    contractor: 'ถาวรพัฒนา',
    owner: 'คค 0709/18/2569',
    roads: [{ id: 'r-3001', code: 'ฉช.3001' }],
    warrantyStart: '2569-01-08',
    warrantyEnd: '2571-02-08',
    warrantyStatus: 'in-warranty',
  },
]

export const MOCK_BUDGET_YEARS = [2569, 2568, 2567, 2566]

export const MOCK_OWNERS = [
  'ขทช.ขอนแก่น',
  'ขทช.นครนายก',
  'ขทช.นครราชสีมา',
  'ขทช.เชียงใหม่',
  'คค 0709/18/2569',
]

export const MOCK_CONTRACTORS = [
  'กิจการค้าร่วม ทีพีเอส',
  'กิจการค้าร่วม ทีไอซี',
  'เค.เอ็น.วี.อินเตอร์เทรด',
  'ถาวรพัฒนา',
]

export const MOCK_ROADS = [
  { id: 'r-1027', code: 'ขก.1027', label: 'ขก.1027' },
  { id: 'r-1039', code: 'ขก.1039', label: 'ขก.1039' },
  { id: 'r-4008', code: 'ขก.4008', label: 'ขก.4008' },
  { id: 'r-3006', code: 'นย.3006', label: 'นย.3006' },
  { id: 'r-3001', code: 'ฉช.3001', label: 'ฉช.3001' },
]
