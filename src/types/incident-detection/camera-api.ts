// Incident Detection (/analytic) — camera-level API types.

import type { MetaData } from '../shared'

// ── GET /analytic/departments/{id}/cameras?solution_id= ───────────────────────
// Map markers / camera list for ONE solution (reliable for overview-list +
// most central-list solution ids). Used by the License modal (camera names).

export interface APIRequestIncidentCameras {
  solution_id?: number | string
  road_code?: string
}

export interface IncidentCameraMapItem {
  id: string
  camera_name: string
  hls_url: string
  geometry_point: [number, number] | null
  /**
   * License token. NOT returned by /analytic yet (BE TODO) — the License modal
   * shows "-" until BE populates it. Optional so the field maps in with zero
   * code change once it arrives.
   */
  license?: string | null
}

export interface APIResponseIncidentCameras {
  cameras: IncidentCameraMapItem[]
  centroid: [number, number] | null
}

// ── GET /analytic/departments/{id}/cameras/list ───────────────────────────────
// Paginated per-camera detail (ip, sta, status, events) — for the detail page.

export interface IncidentCameraEvent {
  event_id: number | null
  event_name: string
  events_count: number
}

export interface IncidentCameraListItem {
  road: { id: number; code_name: string }
  solution: { id: number; solution_name: string; is_warranty: boolean }
  camera: {
    id: string
    camera_name: string
    sta: string
    ip_address: string
    hls_url: string
    last_updated: string
    status: { is_online: boolean; status_name: string }
  }
  events: IncidentCameraEvent[]
}

export interface APIRequestIncidentCameraList {
  solution_id?: number | string
  road_code?: string
  solution_name?: string
  event_name?: string
  status_name?: string
  page?: number
  limit?: number
  search?: string
  field?: string
  sort?: 'asc' | 'desc'
}

export interface APIResponseIncidentCameraList {
  res_data: IncidentCameraListItem[]
  meta_data: MetaData
}

// ── GET /analytic/departments/{id}/cameras/totals?solution_id= ────────────────

export interface APIRequestIncidentCameraTotals {
  solution_id?: number | string
}

export interface APIResponseIncidentCameraTotals {
  camera: { total: number; online: number; offline: number }
}

// ── GET /analytic/departments/{id}/cameras/random-online?limit= ───────────────
// Random online cameras for the overview left-rail live preview.

export interface IncidentRandomOnlineCamera {
  solution_id: number
  camera: {
    id: string
    name: string
    ip_address: string
    hls_url: string
    is_online: boolean
  }
  road: { id: number; code_name: string }
  events_count: number
}

export interface APIResponseIncidentRandomOnline {
  count: number
  limit: number
  data: IncidentRandomOnlineCamera[]
}
