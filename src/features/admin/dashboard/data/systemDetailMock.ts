// MOCK data for the dashboard system-detail card (shown when a donut is clicked).
// All values are placeholders — replace with a real endpoint once BE ships it.
// Every system uses the same 8 fields (confirmed 2026-07-05).

export interface SystemDetailData {
  all: number
  online: number
  offline: number
  inWarranty: number
  outWarranty: number
  openCase: number
  inProgress: number
  closedCase: number
}

// Keyed by the same system id used in RatioChart's STATIC_DONUTS.
export const MOCK_SYSTEM_DETAIL: Record<string, SystemDetailData> = {
  cctv:      { all: 4345, online: 3401, offline: 944, inWarranty: 2259, outWarranty: 1142, openCase: 874, inProgress: 426, closedCase: 448 },
  traffic:   { all: 820,  online: 610,  offline: 210, inWarranty: 500,  outWarranty: 320,  openCase: 140, inProgress: 62,  closedCase: 78 },
  lighting:  { all: 817,  online: 273,  offline: 544, inWarranty: 500,  outWarranty: 317,  openCase: 210, inProgress: 96,  closedCase: 114 },
  vms:       { all: 291,  online: 123,  offline: 168, inWarranty: 180,  outWarranty: 111,  openCase: 64,  inProgress: 28,  closedCase: 36 },
  wim:       { all: 42,   online: 40,   offline: 2,   inWarranty: 30,   outWarranty: 12,   openCase: 5,   inProgress: 2,   closedCase: 3 },
  crosswalk: { all: 18,   online: 6,    offline: 12,  inWarranty: 10,   outWarranty: 8,    openCase: 6,   inProgress: 3,   closedCase: 3 },
  tunnel:    { all: 24,   online: 16,   offline: 8,   inWarranty: 15,   outWarranty: 9,    openCase: 7,   inProgress: 3,   closedCase: 4 },
}
