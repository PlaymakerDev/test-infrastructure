// Traffic Volume (/counting) — license API types.
// GET /counting/license/{solution_id}  (NOT department-scoped). Verified live
// 2026-06-25: returns the solution + every camera's license key & type
// (identical shape to the analytic license endpoint).

export interface TrafficVolumeLicenseItem {
  camera: { id: string; name: string }
  key: string
  type: string
}

export interface APIResponseTrafficVolumeLicense {
  solution: { id: number; name: string }
  license: TrafficVolumeLicenseItem[]
}
