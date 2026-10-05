import type { APIResponseContractor } from '@/types/manage/contractor-api'

/** Who the repair letter is addressed to: the contractor's registered company
 *  name (e.g. "ห้างหุ้นส่วนจำกัด ลำปางภาณุภัทร์ก่อสร้าง 2008"), not the name it
 *  logs in with ("lpc") — user 2026-10-02.
 *
 *  A project only carries its contractor's login user (`contractor.username`);
 *  the company is on the `/manage/project/contractor` row with that user_id.
 *  An officer gets every row there, a contractor just its own, so the same
 *  lookup serves both sides of the case. No match → the login name. */
export const letterContractorName = (
  rows: Pick<APIResponseContractor, 'user_id' | 'company_name'>[] | null | undefined,
  contractorUserId: string | null | undefined,
  loginName: string,
): string => {
  const companyName = contractorUserId
    ? rows?.find((row) => row.user_id === contractorUserId)?.company_name?.trim()
    : undefined
  return companyName || loginName
}
