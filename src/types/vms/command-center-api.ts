export interface VMSMonitorItem {
  vms_id: number
  wid: number
  crossing_master_index: string
  solution_name: string
  is_online: boolean
  last_seen_at?: string
  last_connected?: string
  setting_id?: number
  status?: number
  status_name?: string
  status_updated_at?: string
  setting_type_name?: string
  media_url?: string
  message?: string
  date_since?: string
  date_to?: string
}

export type APIResponseVMSMonitor = VMSMonitorItem[]

export interface APIRequestVMSMonitor {
  vms_ids: number[]
}
