// Power-meter (PM) endpoints for the VMS detail page — `POST /vms/pm-chart`
// and `POST /vms/pm-chart-hour` (BE 2026-09-02). Unlike the bridge-lighting
// twins these take the SOLUTION id directly (the backend resolves the legacy
// wid + meter group itself) — no `/wid` resolver round-trip needed.
//
// Row shape is byte-identical to bridge-lighting's `PmChartData` (same meter
// pipeline behind both) so the type is imported, not redeclared. One VMS
// quirk verified live (solution 2919, 2026-09-02): single-phase signs ship
// the literal string "NaN" in `v_l2/v_l3/i_l2/i_l3` — parse with a
// Number.isFinite guard, never trust `parseFloat` alone.
import type { PmChartData } from '@/types/bridge-lighting/overall-api'

export interface APIRequestPostVMSPmChart {
  solution_id: number
}

// Same contract as bridge-lighting's pm-chart-hour: CE `YYYY-MM-DD` dates,
// inclusive; omitting both falls back to the last ~24 h.
export interface APIRequestPostVMSPmChartHour {
  solution_id: number
  start_date?: string
  end_date?: string
}

export type APIResponsePostVMSPmChart = PmChartData[]

export type { PmChartData }
