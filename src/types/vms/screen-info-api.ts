// VMS agent heartbeat + capability inventory returned from
// `GET /api-v2/vms/screen-info`. One row per registered VMS wid — each row
// aggregates the latest agent report, enixma provisioning state, and the
// "centralized" opt-in flag that gates whether Command Center will actually
// dispatch to the sign.

export type EnixmaStatus = 'none' | 'pending' | 'ok' | 'failed'

export interface ScreenInfoItem {
  wid: number
  vms_id: number
  solution_id: number
  solution_name: string
  sta: string
  road_code: string
  road_name: string
  project_id: number
  project_name: string
  department_id: number
  department_name: string
  department_short_name: string

  // agent heartbeat
  machine_name: string | null
  app_version: string | null
  anydesk_id: string | null
  zt_ip: string | null
  tailscale_ip: string | null
  local_ip: string | null
  source_ip: string | null
  reported_at: string | null
  screen_info_updated_at: string | null
  is_reported: boolean
  is_online: boolean // reported_at <= 15 min

  // enixma reverse tunnel
  enixma_url: string | null
  enixma_status: EnixmaStatus
  enixma_last_error: string | null
  enixma_provisioned_at: string | null
  enixma_checked_at: string | null

  // effective sign screen (falls back through enixma / legacy)
  desktop_screen_url: string | null

  // capability gating
  is_controllable: boolean // is_reported AND is_online AND app_version >= min_controllable_version
  min_controllable_version: string // e.g. "26.7.19.1"
  is_centralized: boolean
}

export interface ScreenInfoSummary {
  total: number
  online: number
  offline: number
  never_reported: number
  centralized: number
  non_centralized: number
  controllable: number
}

export interface APIResponseScreenInfo {
  data: ScreenInfoItem[]
  count: number
  summary: ScreenInfoSummary
}

// PUT /api-v2/vms/screen-info/:wid/centralize
export interface APIRequestScreenInfoCentralize {
  is_centralized: boolean
  reason?: string
}

export type APIResponseScreenInfoCentralize = ScreenInfoItem
