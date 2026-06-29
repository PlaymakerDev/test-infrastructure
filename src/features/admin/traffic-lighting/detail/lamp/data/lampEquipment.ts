/** Mock lamp equipment rows for the installation-point table. */

export type LampEquipStatus = 'up' | 'down'
export type LampConnection = 'connected' | 'disconnected'

export interface LampEquipmentRow {
  key: string
  no: number
  imei: string
  lampStatus: LampEquipStatus
  connection: LampConnection
  amp: number | null
  updatedAt: string
}

export const LAMP_EQUIPMENT_ROWS: LampEquipmentRow[] = [
  { key: '1', no: 1, imei: '86094606176842', lampStatus: 'up', connection: 'connected', amp: 0.93, updatedAt: '21 เม.ย. 2569 11:09:21' },
  { key: '2', no: 2, imei: '86094606176843', lampStatus: 'up', connection: 'connected', amp: 0.91, updatedAt: '21 เม.ย. 2569 11:08:55' },
  { key: '3', no: 3, imei: '86094606176844', lampStatus: 'down', connection: 'disconnected', amp: 0.93, updatedAt: '21 เม.ย. 2569 11:09:21' },
  { key: '4', no: 4, imei: '86094606176845', lampStatus: 'up', connection: 'connected', amp: 0.88, updatedAt: '21 เม.ย. 2569 11:07:12' },
  { key: '5', no: 5, imei: '86094606176846', lampStatus: 'down', connection: 'disconnected', amp: null, updatedAt: '21 เม.ย. 2569 10:45:00' },
  { key: '6', no: 6, imei: '86094606176847', lampStatus: 'up', connection: 'connected', amp: 1.02, updatedAt: '21 เม.ย. 2569 11:09:30' },
  { key: '7', no: 7, imei: '86094606176848', lampStatus: 'up', connection: 'connected', amp: 0.97, updatedAt: '21 เม.ย. 2569 11:09:18' },
  { key: '8', no: 8, imei: '86094606176849', lampStatus: 'down', connection: 'disconnected', amp: 0.45, updatedAt: '21 เม.ย. 2569 09:30:00' },
]
