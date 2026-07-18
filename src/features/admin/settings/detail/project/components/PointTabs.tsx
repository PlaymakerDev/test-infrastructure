"use client"
import React from 'react'
import { TbPlus } from 'react-icons/tb'
import { useProjectDetailContext } from '../context'

interface Props {
  onAddPoint: () => void
}

const PointTabs: React.FC<Props> = ({ onAddPoint }) => {
  const { activeRoute, activePointId, setActivePointId, activePointTaskTypes } =
    useProjectDetailContext()

  if (!activeRoute) return null

  return (
    <div className='flex items-center gap-4 flex-wrap border-b border-white/10 pb-2'>
      {activeRoute.points.map((p) => {
        const isActive = p.id === activePointId
        // Only the ACTIVE point has its task types loaded; other tabs show a
        // placeholder count until the user clicks in. Keeps the initial page
        // fetch minimal.
        const count = isActive ? activePointTaskTypes.length : (p.taskTypes?.length ?? '·')
        return (
          <button
            key={p.id}
            type='button'
            onClick={() => setActivePointId(p.id)}
            className={`inline-flex items-center gap-2 py-1 cursor-pointer transition-colors ${
              isActive ? 'text-(--yellow) border-b-2 border-(--yellow)' : 'text-white/70 hover:text-white'
            }`}
            style={{ marginBottom: -9 }}
          >
            <span>{p.name}</span>
            <span
              className='inline-flex items-center justify-center w-6 h-6 rounded-full text-xs'
              style={{
                border: `1px solid ${isActive ? 'var(--yellow)' : 'rgba(255,255,255,0.4)'}`,
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
      <button
        type='button'
        onClick={onAddPoint}
        className='inline-flex items-center gap-1 text-(--yellow) hover:opacity-80 cursor-pointer py-1'
      >
        <TbPlus /> เพิ่มจุดติดตั้ง
      </button>
    </div>
  )
}

export default React.memo<Props>(PointTabs)
