"use client"
import { Button } from 'antd'
import React from 'react'
import { useProjectDetailContext } from '../context'

const RouteTabs: React.FC = () => {
  const { project, activeRouteId, setActiveRouteId, setActivePointId } = useProjectDetailContext()

  return (
    <section className='mt-5 px-3'>
      <p className='text-(--default-blue) mb-2'>สายทางทั้งหมดในโครงการ</p>
      <div className='flex items-center gap-2 flex-wrap'>
        {project.routes.map((r) => {
          const isActive = r.id === activeRouteId
          return (
            <Button
              key={r.id}
              shape='round'
              size='large'
              type={isActive ? 'primary' : 'default'}
              ghost={!isActive}
              onClick={() => {
                setActiveRouteId(r.id)
                setActivePointId(r.points[0]?.id ?? '')
              }}
              style={{
                background: isActive ? 'var(--default-blue)' : 'transparent',
                color: isActive ? '#000' : 'var(--default-blue)',
                borderColor: 'var(--default-blue)',
                fontWeight: 600,
              }}
            >
              {r.code}
            </Button>
          )
        })}
      </div>
    </section>
  )
}

export default React.memo(RouteTabs)
