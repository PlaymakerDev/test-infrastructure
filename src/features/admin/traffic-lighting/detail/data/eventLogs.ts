export type EventLogLevel = 'Warning' | 'Alert'
export type EventLogLineStatus = 'UP' | 'DOWN'

export interface EventLogRecord {
  key: string
  datetime: string
  device: string
  event: string
  level: EventLogLevel
  lineStatus: EventLogLineStatus
}

/** Mock event logs — 10 rows (5 UP / 5 DOWN) for detail OVERVIEW tab. */
export const EVENT_LOGS: EventLogRecord[] = [
  {
    key: '1',
    datetime: '20 เม.ย. 2569 11:35:33',
    device: 'Transformer เฟส 1',
    event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง',
    level: 'Warning',
    lineStatus: 'UP',
  },
  {
    key: '2',
    datetime: '20 เม.ย. 2569 12:10:05',
    device: 'Transformer เฟส 2',
    event: 'อาจเกิดไฟช็อตในตู้ / ซ่อมบำรุง',
    level: 'Warning',
    lineStatus: 'DOWN',
  },
  {
    key: '3',
    datetime: '20 เม.ย. 2569 13:22:18',
    device: 'Transformer เฟส 3',
    event: 'กลับมาใช้งานได้',
    level: 'Alert',
    lineStatus: 'UP',
  },
  {
    key: '4',
    datetime: '19 เม.ย. 2569 09:45:10',
    device: 'Line สาย A',
    event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง',
    level: 'Alert',
    lineStatus: 'DOWN',
  },
  {
    key: '5',
    datetime: '19 เม.ย. 2569 08:22:55',
    device: 'Line สาย B',
    event: 'กลับมาใช้งานได้',
    level: 'Warning',
    lineStatus: 'UP',
  },
  {
    key: '6',
    datetime: '18 เม.ย. 2569 17:05:44',
    device: 'วงจรหลัก',
    event: 'อาจเกิดไฟช็อตในตู้ / ซ่อมบำรุง',
    level: 'Alert',
    lineStatus: 'DOWN',
  },
  {
    key: '7',
    datetime: '18 เม.ย. 2569 14:30:20',
    device: 'วงจรสำรอง',
    event: 'กลับมาใช้งานได้',
    level: 'Warning',
    lineStatus: 'UP',
  },
  {
    key: '8',
    datetime: '17 เม.ย. 2569 11:10:05',
    device: 'สายส่งไฟฟ้า',
    event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง',
    level: 'Alert',
    lineStatus: 'DOWN',
  },
  {
    key: '9',
    datetime: '17 เม.ย. 2569 09:18:42',
    device: 'ตู้ควบคุมไฟจราจร',
    event: 'กลับมาใช้งานได้',
    level: 'Warning',
    lineStatus: 'UP',
  },
  {
    key: '10',
    datetime: '16 เม.ย. 2569 16:55:11',
    device: 'โคมไฟถนน',
    event: 'อาจเกิดไฟช็อตในตู้ / ซ่อมบำรุง',
    level: 'Alert',
    lineStatus: 'DOWN',
  },
]

export const EVENT_LOG_SUMMARY = {
  total: EVENT_LOGS.length,
  up: EVENT_LOGS.filter((r) => r.lineStatus === 'UP').length,
  down: EVENT_LOGS.filter((r) => r.lineStatus === 'DOWN').length,
} as const
