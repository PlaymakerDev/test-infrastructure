// Incident Detection (/analytic) — details API types.
// Powers detail-page event chart/list/stat cards. Verified live 2026-06-23.

import type { MetaData } from '../shared'

// ── GET /analytic/details?solution_id=&start_date=&end_date=&analytic_type_id ─
// One bucket per date in range; each bucket lists count per event type.

export interface IncidentDailyTypeCount {
  analytic_type_id: number
  analytic_name_th: string
  count: number
}

export interface IncidentDailyBucket {
  date: string
  date_label: string
  data: IncidentDailyTypeCount[]
}

export type APIResponseIncidentDaily = IncidentDailyBucket[]

export interface APIRequestIncidentDaily {
  solution_id: number | string
  start_date?: string
  end_date?: string
  analytic_type_id?: number
}

// ── GET /analytic/details/transactions ────────────────────────────────────────
// Paginated event rows + a summary of counts per type.

export interface APIRequestIncidentTransactions {
  solution_id: number | string
  start_date?: string
  end_date?: string
  analytic_type_id?: number
  page?: number
  limit?: number
}

/** One row = one detected event. `image_path` is a real snapshot URL. */
export interface IncidentTransactionItem {
  id: number
  camera_id: string
  analytic_type: number
  speed: number
  vehicle_type_id: number
  /** ISO 8601 — e.g. "2026-06-23T15:47:03+07:00". */
  date_time: string
  image_path: string
  video_path: string
  analytic_type_info: {
    id: number
    analytic_type_name_en: string
    analytic_type_name_th: string
  }
  camera: {
    id: string
    ip_address: string
    department_id: number
    road_id: number
    solution_id: number
    camera_name: string
    sta: string
    hls_url: string
    point_geometry: [number, number]
    remark: string
  }
}

export interface IncidentTransactionsSummaryItem {
  analytic_type: number
  type_name_en: string
  type_name_th: string
  count: number
}

export interface IncidentTransactionsSummary {
  total: number
  type_details: IncidentTransactionsSummaryItem[]
}

export interface APIResponseIncidentTransactions {
  res_data: IncidentTransactionItem[]
  meta_data: MetaData
  summary: IncidentTransactionsSummary
}

// ── GET /analytic/details/{department_id}/dashboard?type= ─────────────────────
// Bucketed event counts. For type=daily → 24 hourly buckets ("00:00"–"23:00").

export type IncidentDashboardType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface IncidentDashboardBucket {
  label: string
  count: number
}

export type APIResponseIncidentDashboard = IncidentDashboardBucket[]
