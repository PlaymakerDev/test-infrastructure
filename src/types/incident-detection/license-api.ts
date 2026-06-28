// Incident Detection (/analytic) — license API types.
// GET /analytic/license/{solution_id}  (NOT department-scoped). Verified live
// 2026-06-23: returns the solution + every camera's license key & type.

export interface IncidentLicenseItem {
  camera: { id: string; name: string }
  key: string
  type: string
}

export interface APIResponseIncidentLicense {
  solution: { id: number; name: string }
  license: IncidentLicenseItem[]
}
