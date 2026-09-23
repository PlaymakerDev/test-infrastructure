/** Shared shapes for the role-split case views (2026-09-11 redesign):
 *  the screen resolves data once and hands these to
 *  OfficerCaseView / ContractorCaseView. */

export interface CaseProjectInfo {
  projectName: string
  contractor: string
  agency: string
  contractNo: string
  warrantyStart: string
  warrantyEnd: string
  warrantyStatus: 'active' | 'expired'
}

/** One device attached to the case — built from the case's own `cameras[]`
 *  (multi-device since the 2026-09-16 backend release). */
export interface CaseDeviceRow {
  cameraId: string
  type: string
  hostname: string
  ip: string
  offlineDate: string
  offlineDays: number
  isOnline: boolean
  hasLive: boolean
}

/** Header line under the Case No.: one device shows its hostname, several show
 *  the first plus a count, so a multi-device case reads correctly. */
export const deviceSummary = (devices: CaseDeviceRow[]): string => {
  if (devices.length === 0) return '-'
  const [first, ...rest] = devices
  return rest.length > 0 ? `${first.hostname} +${rest.length} อุปกรณ์` : first.hostname
}
