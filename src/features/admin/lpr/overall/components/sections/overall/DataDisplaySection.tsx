"use client"
import React, { useMemo, useState } from 'react'
import { TbLayoutGrid, TbTable } from 'react-icons/tb'
import { TableLPRData, LPRList } from '../../../components'

interface Props {
  deptId?: string | string[] | number
}

type ViewMode = 'TABLE' | 'GRID'

/** Search + filter bar for LPR install-points was originally reused from the
 *  VMS/CCTV list (warranty + online filters). None of that applies here —
 *  LPR install-points are always active by definition; there's no warranty
 *  contract per point. Simplified to just the table/grid view toggle. */
const DataDisplaySection: React.FC<Props> = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  const content = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return <TableLPRData />
      case 'GRID':
        return <LPRList />
    }
  }, [viewMode])

  return (
    <div>
      <section className='flex items-center justify-between mb-4'>
        <h3 className='text-white'>จุดติดตั้ง LPR ทั้งหมด</h3>
        <div className='flex items-center gap-1 bg-(--mid-gray) rounded-lg p-1'>
          <button
            type='button'
            onClick={() => setViewMode('TABLE')}
            title='มุมมองตาราง'
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 fs-12 transition-colors ${
              viewMode === 'TABLE'
                ? 'bg-(--yellow) text-black font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TbTable size={16} /> ตาราง
          </button>
          <button
            type='button'
            onClick={() => setViewMode('GRID')}
            title='มุมมองการ์ด'
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 fs-12 transition-colors ${
              viewMode === 'GRID'
                ? 'bg-(--yellow) text-black font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TbLayoutGrid size={16} /> การ์ด
          </button>
        </div>
      </section>
      <section>{content}</section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
