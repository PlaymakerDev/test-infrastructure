export interface VMSStatusHistoryEntry {
  id: number
  setting_id: number
  command_no?: number
  crossing_master_index: string
  prev_status: number | null
  status: number
  prev_status_name?: string
  status_name: string
  source: string
  changed_by?: string
  reported_at: string
  setting_type_name?: string
  wid?: number
  solution_name?: string
}

export type APIResponseVMSStatusHistory = VMSStatusHistoryEntry[]

export interface APIRequestVMSStatusHistory {
  limit?: number
}
