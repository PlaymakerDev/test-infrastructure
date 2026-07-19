export type VMSStatusKind =
  | 'pending'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'done'
  | 'lost'
  | 'cancel'
  | 'overwrite'

export interface VMSStatusMeta {
  id: number
  label: string
  color: string
  ring: string
  kind: VMSStatusKind
  isActive: boolean
  isTerminal: boolean
  isCancellable: boolean
}

// Canonical mapping — matches vms.tbl_vms_setting_status seed data.
// Keep in sync with backend enum. `isActive` = still in flight (0..3).
// `isCancellable` = 0..3 (only these can be flipped to 6 via cancel).
export const VMS_STATUS: Record<number, VMSStatusMeta> = {
  0: {
    id: 0,
    label: 'รอส่งคำสั่ง',
    color: '#94a3b8',
    ring: '#64748b',
    kind: 'pending',
    isActive: true,
    isTerminal: false,
    isCancellable: true,
  },
  1: {
    id: 1,
    label: 'กำลังดาวน์โหลด',
    color: '#f59e0b',
    ring: '#b45309',
    kind: 'loading',
    isActive: true,
    isTerminal: false,
    isCancellable: true,
  },
  2: {
    id: 2,
    label: 'พร้อมแสดงผล',
    color: '#3b82f6',
    ring: '#1d4ed8',
    kind: 'ready',
    isActive: true,
    isTerminal: false,
    isCancellable: true,
  },
  3: {
    id: 3,
    label: 'กำลังแสดงผล',
    color: '#22c55e',
    ring: '#15803d',
    kind: 'playing',
    isActive: true,
    isTerminal: false,
    isCancellable: true,
  },
  4: {
    id: 4,
    label: 'เสร็จสิ้น',
    color: '#6b7280',
    ring: '#374151',
    kind: 'done',
    isActive: false,
    isTerminal: true,
    isCancellable: false,
  },
  5: {
    id: 5,
    label: 'ขาดการเชื่อมต่อ',
    color: '#ef4444',
    ring: '#b91c1c',
    kind: 'lost',
    isActive: false,
    isTerminal: false,
    isCancellable: false,
  },
  6: {
    id: 6,
    label: 'ยกเลิกคำสั่ง',
    color: '#a855f7',
    ring: '#7e22ce',
    kind: 'cancel',
    isActive: false,
    isTerminal: true,
    isCancellable: false,
  },
  7: {
    id: 7,
    label: 'ถูกสั่งทับ',
    color: '#eab308',
    ring: '#a16207',
    kind: 'overwrite',
    isActive: false,
    isTerminal: true,
    isCancellable: false,
  },
}

export function statusMeta(status: number | null | undefined): VMSStatusMeta {
  const s = typeof status === 'number' && VMS_STATUS[status] ? status : 0
  return VMS_STATUS[s]
}

export const VMS_STATUS_SOURCE_LABEL: Record<string, string> = {
  device: 'จากป้าย',
  admin_override: 'ผู้ดูแล (สั่งงานใหม่ทับคำสั่งเดิม)',
  admin_cancel: 'ผู้ดูแล (ยกเลิก)',
  admin_edit: 'ผู้ดูแล (แก้ไข)',
  watcher_disconnect: 'ระบบ (ตรวจพบขาดการเชื่อมต่อ)',
  watcher_expired: 'ระบบ (สิ้นสุดตามกำหนดการ)',
  worker_advance: 'ระบบ (อัพเดตอัตโนมัติ)',
  seed: 'ประวัติเริ่มต้น',
  unknown: 'ไม่ระบุที่มา',
}

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return VMS_STATUS_SOURCE_LABEL.unknown
  return VMS_STATUS_SOURCE_LABEL[source] ?? source
}
