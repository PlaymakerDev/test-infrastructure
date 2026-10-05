import React from 'react'
import type { ContractorData } from '@/types/manage/contractor-api'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  item: Pick<ContractorData, 'project_count' | 'solution_count' | 'solution_type_count'>
}

/** "N โครงการ · N จุดติดตั้ง · N Solution" — the ผู้รับจ้าง tab's row title and
 *  the contractor summary page show the same three.
 *
 *  GET /manage/contractor counts the contractor's solutions two ways:
 *  `solution_count` = every one (COUNT tbl_solution), shown as จุดติดตั้ง, and
 *  `solution_type_count` = distinct ประเภทงาน — the same set as the การทำงาน
 *  tags — shown as Solution (user 2026-09-30; the two were swapped). The
 *  payload has no count of the จุดติดตั้ง rows themselves (tbl_solution_location). */
const ContractorCountPills: React.FC<Props> = ({ item }) => (
  <>
    <div className='shrink-0 rounded-3xl border border-(--default-blue) text-(--default-blue) px-5 py-1'>
      <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.project_count)) || 0} โครงการ</p>
    </div>
    <div className='shrink-0 rounded-3xl border border-(--yellow) text-(--yellow) px-5 py-1'>
      <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.solution_count)) || 0} จุดติดตั้ง</p>
    </div>
    <div className='shrink-0 rounded-3xl border border-(--default-orange) text-(--default-orange) px-5 py-1'>
      <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(item.solution_type_count)) || 0} Solution</p>
    </div>
  </>
)

export default React.memo<Props>(ContractorCountPills)
