import { Tooltip } from 'antd'
import React from 'react'
import { SYSTEM_BRIGHT, type SystemType } from '@/features/admin/dashboard/data/systems'
import type { ProjSubSolutionGroup } from '@/types/manage/project-api'

interface Props {
  items?: ProjSubSolutionGroup[]
  /** 'collapsed' (default) shows `visibleCount` tags then a "(...อีก N
   *  รายการ)" tag with the rest behind a hover Tooltip. 'all' renders every
   *  tag with no cutoff — used by the table view, which has room to spare. */
  display?: 'collapsed' | 'all'
  /** Tags shown before the rest collapse behind "(...อีก N รายการ)" — only
   *  applies when `display='collapsed'`. */
  visibleCount?: number
}

// Backend spells this type "Crosswalk"; SYSTEM_BRIGHT's key is "CrossWalk".
const solutionColor = (name: string) => {
  const key = name === 'Crosswalk' ? 'CrossWalk' : name
  return SYSTEM_BRIGHT[key as SystemType] || '#000'
}

const tagClassName = 'inline-flex items-center justify-center px-3 py-1 rounded-full fs-12 whitespace-nowrap'

// Bright variant (not the dark SYSTEMS legend tone, which reads too dim as a
// thin outline chip) — see SYSTEM_BRIGHT's own doc comment.
export const SolutionTag: React.FC<{ name: string }> = ({ name }) => (
  <span
    className={tagClassName}
    style={{ border: `1px solid ${solutionColor(name)}`, color: solutionColor(name) }}
  >
    {name}
  </span>
)

/** Shared "การทำงาน" tag list for the contractor table + grid views. */
const SolutionTagList: React.FC<Props> = ({ items, display = 'collapsed', visibleCount = 2 }) => {
  if (!items?.length) return '-'

  if (display === 'all') {
    return (
      <div className='flex flex-wrap items-center gap-1'>
        {items.map((s) => (
          <SolutionTag key={s.id} name={s.name} />
        ))}
      </div>
    )
  }

  const visible = items.slice(0, visibleCount)
  const rest = items.slice(visibleCount)

  return (
    <div className='flex flex-wrap items-center justify-center gap-1'>
      {visible.map((s) => (
        <SolutionTag key={s.id} name={s.name} />
      ))}
      {rest.length > 0 && (
        <Tooltip
          title={(
            <div className='flex flex-wrap gap-1'>
              {rest.map((s) => (
                <SolutionTag key={s.id} name={s.name} />
              ))}
            </div>
          )}
        >
          <span
            className={`${tagClassName} cursor-pointer`}
            style={{ border: '1px solid #fff', color: '#fff' }}
          >
            ...อีก {rest.length} รายการ
          </span>
        </Tooltip>
      )}
    </div>
  )
}

export default React.memo<Props>(SolutionTagList)
