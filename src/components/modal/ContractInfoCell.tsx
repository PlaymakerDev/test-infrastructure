"use client"
import React from 'react'
import ProjectInfoIcon from './ProjectInfoIcon'

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
  const hasContract = !!(contractNo && String(contractNo).trim())
  const label = hasContract
    ? contractNo
    : budgetYear
      ? `ปีงบประมาณ ${budgetYear}`
      : '-'

  return (
    <span className='inline-flex items-center gap-1.5'>
      <span>{label}</span>
      <ProjectInfoIcon projectId={projectId} roadId={roadId} enabled={hasContract} />
    </span>
  )
}

export default React.memo<Props>(ContractInfoCell)
