"use client"
import { Button, Modal } from 'antd'
import React, { useState } from 'react'
import { TbTrash } from 'react-icons/tb'
import { useProjectDetailContext } from '../context'

/** Route (project_road) tabs. Active tab shows a trash button that
 *  deletes the entire route from the project — backend blocks the
 *  delete with a FK error if any solution_locations still hang off
 *  it, so the confirm copy reads "empty routes only". */
const RouteTabs: React.FC = () => {
  const { project, activeRouteId, activeRoute, setActiveRouteId, removeRoute, isSubmitting } =
    useProjectDetailContext()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDeleteRoute = async () => {
    if (!activeRoute) return
    await removeRoute(activeRoute.projectRoadId)
    setConfirmOpen(false)
  }

  return (
    <section className='mt-5 px-3'>
      <div className='flex items-center justify-between mb-2'>
        <p className='text-(--default-blue) mb-0'>สายทางทั้งหมดในโครงการ</p>
        {activeRoute && (
          <button
            type='button'
            onClick={() => setConfirmOpen(true)}
            disabled={isSubmitting}
            className='inline-flex items-center gap-1 text-(--red) hover:opacity-80 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
            title='ลบสายทางที่กำลังเลือกออกจากโครงการ'
          >
            <TbTrash size={16} />
            <span style={{ fontSize: 13 }}>ลบสายทางนี้</span>
          </button>
        )}
      </div>
      <div className='flex items-center gap-2 flex-wrap'>
        {project.routes.map((r) => {
          const isActive = r.projectRoadId === activeRouteId
          return (
            <Button
              key={r.projectRoadId}
              shape='round'
              size='large'
              type={isActive ? 'primary' : 'default'}
              ghost={!isActive}
              onClick={() => setActiveRouteId(r.projectRoadId)}
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

      <Modal
        wrapClassName='light-modal'
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        footer={null}
        destroyOnHidden
        width={520}
        centered
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={null}
      >
        <div className='text-center py-2'>
          <div
            className='mx-auto mb-3 flex items-center justify-center rounded-full'
            style={{ width: 56, height: 56, background: '#FFECEC' }}
          >
            <TbTrash size={30} color='#FF3B3B' />
          </div>
          <h3 style={{ color: '#1F1F1F', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
            ยืนยันลบสายทางออกจากโครงการ?
          </h3>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            การลบไม่สามารถย้อนกลับได้ — หากยังมีจุดติดตั้งอยู่ ระบบจะแจ้ง error
          </p>
          <div
            className='inline-flex items-center'
            style={{
              background: '#FFF5F5',
              border: '1px solid #FFCCCC',
              borderRadius: 8,
              padding: '10px 20px',
              color: '#1F1F1F',
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            {activeRoute?.code} {activeRoute?.name ? `— ${activeRoute.name}` : ''}
          </div>
          <div className='flex justify-center gap-3'>
            <Button
              shape='round'
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
              style={{
                background: '#E5E5E5',
                color: '#4A4A4A',
                borderColor: '#E5E5E5',
                padding: '8px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              onClick={handleDeleteRoute}
              loading={isSubmitting}
              danger
              style={{
                background: '#FF3B3B',
                color: '#FFFFFF',
                borderColor: '#FF3B3B',
                padding: '8px 32px',
                height: 'auto',
                fontWeight: 600,
              }}
            >
              ยืนยันลบ
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default React.memo(RouteTabs)
