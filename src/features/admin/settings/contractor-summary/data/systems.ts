/** The ten systems of "ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ", in the order and
 *  colours the user set (2026-09-30). `prefix` is the service whose
 *  `/departments/{id}/…/uptime-statistics` counts the system, `block` the key
 *  that service files its totals under. */
export interface SummarySystem {
  key: string
  label: string
  color: string
  prefix: string
  block: string
  /** The three wide rings the row opens with. */
  large?: boolean
}

export const SUMMARY_SYSTEMS: readonly SummarySystem[] = [
  { key: 'cctv', label: 'CCTV', color: '#66AEFF', prefix: 'cctv', block: 'camera', large: true },
  { key: 'vms', label: 'VMS', color: '#FF9966', prefix: 'vms', block: 'vms', large: true },
  { key: 'lighting', label: 'Street Light', color: '#D4FF66', prefix: 'lighting', block: 'lighting', large: true },
  { key: 'counting', label: 'Traffic Volume', color: '#35CAB7', prefix: 'counting', block: 'counting' },
  { key: 'analytic', label: 'Detection', color: '#44CB87', prefix: 'analytic', block: 'analytic' },
  { key: 'traffic', label: 'Traffic Signal', color: '#A0DC4B', prefix: 'traffic', block: 'traffic' },
  { key: 'lpr', label: 'LPR', color: '#FF6FB5', prefix: 'lpr', block: 'lpr' },
  { key: 'bridge_lighting', label: 'Bridge Lighting', color: '#FC6953', prefix: 'bridge_lighting', block: 'bridge_lighting' },
  { key: 'crosswalk', label: 'Crosswalk', color: '#6A87F7', prefix: 'crosswalk', block: 'crosswalk' },
  { key: 'tunnel', label: 'Tunnel', color: '#A67AF7', prefix: 'tunnel', block: 'tunnel' },
]

/** `solution_type_id` of Tunnel — its ring is only worked out for a
 *  contractor whose solution_group lists it (see useContractorDeviceRings). */
export const TUNNEL_SOLUTION_TYPE_ID = 8
