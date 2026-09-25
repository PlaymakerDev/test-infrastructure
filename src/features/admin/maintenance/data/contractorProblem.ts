import type { CaseDetail } from '@/types/maintenance'
import { parseImageUrls } from './parseImageUrls'

type ContractorFields = Pick<
  CaseDetail,
  'problem_found' | 'solution_method' | 'inspection_date' | 'after_image'
>

/** Has the contractor started filing their repair report?
 *
 *  Only fields the contractor alone can write count — the officer's letter
 *  form never touches problem_found, solution_method, inspection_date or
 *  after_image. This is what gates the officer's ผลการซ่อม block (empty state
 *  until it's true), so a case still waiting on the vendor shows nothing.
 */
export function isContractorFilled(caseData: ContractorFields): boolean {
  return Boolean(
    caseData.problem_found?.trim() ||
    caseData.solution_method ||
    caseData.inspection_date ||
    parseImageUrls(caseData.after_image).length > 0,
  )
}

/** ปัญหาที่พบ — the CONTRACTOR's field.
 *
 *  The backend split this out of `problem` into `problem_found` on 2026-09-21
 *  but did NOT migrate the existing rows, so a case the contractor filled
 *  before the split still carries their text in `problem`. Fall back to it
 *  only when the contractor demonstrably worked on the case: on a freshly
 *  opened one `problem` holds the OFFICER's เหตุผลการแจ้งซ่อม from the letter,
 *  and surfacing that here is exactly the overlap the split was meant to end.
 *
 *  Self-healing: the next contractor save writes `problem_found`, after which
 *  the fallback never fires again for that case.
 */
export function contractorProblem(caseData: CaseDetail): string {
  if (caseData.problem_found?.trim()) return caseData.problem_found
  const touched = isContractorFilled(caseData) || parseImageUrls(caseData.before_image).length > 0
  return touched ? (caseData.problem ?? '') : ''
}
