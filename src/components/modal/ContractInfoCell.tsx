"use client"
import React from 'react'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

interface Props {
  /** เลขที่สัญญา. Empty/missing → falls back to the budget year. */
  contractNo?: string | null
  /** ปีงบประมาณ (already พ.ศ. from BE) — shown when there's no contract number. */
  budgetYear?: number | string | null
  projectId?: number | string | null
  roadId?: number | string | null
}

/** "เลขที่สัญญา" table cell shared by every overall table (cctv / traffic-signal /
 *  incident-detection). Shows the contract number with a clickable ⓘ that opens
 *  the central Project Info modal. When the project has NO contract number, it
 *  shows the budget year (ปีงบประมาณ, พ.ศ.) instead and the ⓘ is disabled —
 *  there's no contract/project record to view. */
const ContractInfoCell: React.FC<Props> = ({ contractNo, budgetYear, projectId, roadId }) => {
  const dispatch = useAppDispatch()
  const hasContract = !!(contractNo && String(contractNo).trim())
  const label = hasContract
    ? contractNo
    : budgetYear
      ? `ปีงบประมาณ ${budgetYear}`
      : '-'

  return (
    <span className='inline-flex items-center gap-1.5'>
      <span>{label}</span>
      <TbInfoSquareRoundedFilled
        size={18}
        className={hasContract ? 'cursor-pointer hover:text-(--yellow)' : 'cursor-not-allowed'}
        style={{ color: hasContract ? '#fff' : '#555' }}
        title={hasContract ? 'ดูข้อมูลโครงการ' : 'ไม่มีข้อมูลโครงการ'}
        onClick={
          hasContract
            ? () =>
                dispatch(
                  setProjectInfoModalOpen({
                    open: true,
                    project_id: projectId ? Number(projectId) : null,
                    road_id: roadId ? Number(roadId) : null,
                  }),
                )
            : undefined
        }
      />
    </span>
  )
}

export default React.memo<Props>(ContractInfoCell)
