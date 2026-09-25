import type { CaseStatus } from '@/types/maintenance'

/** Label + colour for a case's สถานะการดำเนินการ pill.
 *
 *  The backend exposes a real status enum (2026-09-16 release), so the pill no
 *  longer guesses from `closed_at`/filled fields — a contractor who saved work
 *  without closing reads "กำลังดำเนินการ" instead of "ดำเนินการเสร็จสิ้น".
 *  `pending_approval` (contractor done, officer hasn't approved) sits in the
 *  same in-progress bucket the all-repairs tabs use. */
export const caseStatusMeta = (
  status: CaseStatus | undefined,
  closedAt?: string | null,
): { label: string; color: string; done: boolean } => {
  if (status === 'closed' || (!status && closedAt)) {
    return { label: 'ดำเนินการเสร็จสิ้น', color: '#05F2DB', done: true }
  }
  if (status === 'in_progress' || status === 'pending_approval') {
    return { label: 'กำลังดำเนินการ', color: '#FCD116', done: false }
  }
  return { label: 'ยังไม่ดำเนินการ', color: '#E94C4C', done: false }
}
