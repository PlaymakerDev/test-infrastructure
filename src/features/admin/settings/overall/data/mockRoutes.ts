import type { Route } from '../types/route'

// Placeholder data — swap with API once /api-v2/manage/routes endpoints
// are ready. Kept small and realistic so the table/filters demo end-to-end.
export const MOCK_ROUTES: Route[] = [
  {
    id: 'rt-001',
    code: 'ขก.1027',
    name: 'ถนนสาย ขก.1027 แยกทางหลวงหมายเลข 2 - บ้านโคกท่า',
    province: 'ขอนแก่น',
    district: 'เมืองขอนแก่น',
    lengthKm: 12.45,
    responsibleOffice: 'ขทช.ขอนแก่น',
    createdAt: '2025-04-12T08:30:00.000Z',
  },
  {
    id: 'rt-002',
    code: 'ขก.4008',
    name: 'ถนนสาย ขก.4008 แยกทางหลวงหมายเลข 2062 - บ้านเหล่านาดี',
    province: 'ขอนแก่น',
    district: 'มัญจาคีรี',
    lengthKm: 24.10,
    responsibleOffice: 'ขทช.ขอนแก่น',
    createdAt: '2025-05-20T09:15:00.000Z',
  },
  {
    id: 'rt-003',
    code: 'นย.3006',
    name: 'ถนนสาย นย.3006 แยกทางหลวงหมายเลข 305 - บ้านคลองหกวา',
    province: 'นครนายก',
    district: 'องครักษ์',
    lengthKm: 8.72,
    responsibleOffice: 'ขทช.นครนายก',
    createdAt: '2025-06-02T10:00:00.000Z',
  },
  {
    id: 'rt-004',
    code: 'ฉช.3001',
    name: 'ถนนสาย ฉช.3001 แยกทางหลวงหมายเลข 314 - บ้านลาดกระบัง',
    province: 'ฉะเชิงเทรา',
    district: 'บางบ่อ',
    lengthKm: 15.30,
    responsibleOffice: 'ขทช.ฉะเชิงเทรา',
    createdAt: '2025-06-18T11:20:00.000Z',
  },
  {
    id: 'rt-005',
    code: 'นม.2010',
    name: 'ถนนสาย นม.2010 แยกทางหลวงหมายเลข 226 - บ้านหนองบัวโคก',
    province: 'นครราชสีมา',
    district: 'จักราช',
    lengthKm: 18.94,
    responsibleOffice: 'ขทช.นครราชสีมา',
    createdAt: '2025-07-05T13:45:00.000Z',
  },
  {
    id: 'rt-006',
    code: 'นม.4015',
    name: 'ถนนสาย นม.4015 แยกทางหลวงหมายเลข 224 - บ้านหินดาด',
    province: 'นครราชสีมา',
    district: 'ห้วยแถลง',
    lengthKm: 22.08,
    responsibleOffice: 'ขทช.นครราชสีมา',
    createdAt: '2025-08-14T09:00:00.000Z',
  },
  {
    id: 'rt-007',
    code: 'ชม.3020',
    name: 'ถนนสาย ชม.3020 แยกทางหลวงหมายเลข 108 - บ้านแม่แจ่ม',
    province: 'เชียงใหม่',
    district: 'แม่แจ่ม',
    lengthKm: 31.55,
    responsibleOffice: 'ขทช.เชียงใหม่',
    createdAt: '2025-09-01T14:10:00.000Z',
  },
  {
    id: 'rt-008',
    code: 'ชม.5045',
    name: 'ถนนสาย ชม.5045 เชื่อมทางหลวงชนบท - บ้านสันติสุข',
    province: 'เชียงใหม่',
    district: 'ดอยสะเก็ด',
    lengthKm: 9.62,
    responsibleOffice: 'ขทช.เชียงใหม่',
    createdAt: '2025-10-11T08:50:00.000Z',
  },
]

export const MOCK_ROUTE_PROVINCES = [
  'ขอนแก่น',
  'นครนายก',
  'นครราชสีมา',
  'ฉะเชิงเทรา',
  'เชียงใหม่',
]

export const MOCK_ROUTE_OFFICES = [
  'ขทช.ขอนแก่น',
  'ขทช.นครนายก',
  'ขทช.นครราชสีมา',
  'ขทช.ฉะเชิงเทรา',
  'ขทช.เชียงใหม่',
]
