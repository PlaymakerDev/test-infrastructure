"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import dayjs from 'dayjs'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'
import { useOverallContext } from '../../context'
import type { Project } from '../../types/project'
import StatusBadge from './StatusBadge'

interface Props {
  open: boolean
  project: Project | null
  onClose: () => void
}

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2 text-sm'>
    <span className='text-gray-600 shrink-0'>{label}&nbsp;:</span>
    <span className='text-black break-words'>{children}</span>
  </div>
)

const formatBuddhistDate = (iso: string) => {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const buddhistYear = d.year() + 543
  const monthMap = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${d.date()} ${monthMap[d.month()]} ${buddhistYear.toString().slice(-4)}`
}

const DeleteProjectModal: React.FC<Props> = ({ open, project, onClose }) => {
  const { deleteProject } = useOverallContext()

  const handleConfirm = () => {
    if (project) deleteProject(project.id)
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
          },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={620} closable={false}>
        <div className='flex flex-col items-center gap-4 py-2'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center'
            style={{ border: '3px solid #FF6666' }}
          >
            <TbAlertCircle size={40} color='#FF6666' />
          </div>
          <div className='text-center'>
            <h3 className='text-black font-bold text-lg m-0'>ยืนยันลบโครงการหรือไม่?</h3>
            <p className='text-gray-500 text-sm mt-1 mb-0'>
              ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {project && (
            <div
              className='w-full rounded-xl p-4 space-y-1.5'
              style={{ border: '1px solid #FF6666', background: '#FFF5F5' }}
            >
              <InfoRow label='ชื่อโครงการ'>{project.name}</InfoRow>
              <InfoRow label='ปีงบประมาณ'>{project.budgetYear}</InfoRow>
              <InfoRow label='เลขที่สัญญา'>{project.contractNo}</InfoRow>
              <InfoRow label='ผู้ว่าจ้าง'>{project.owner}</InfoRow>
              <InfoRow label='ผู้รับจ้าง'>{project.contractor}</InfoRow>
              <InfoRow label='วันที่เริ่มต้นค้ำประกัน'>{formatBuddhistDate(project.warrantyStart)}</InfoRow>
              <InfoRow label='วันที่สิ้นสุดค้ำประกัน'>{formatBuddhistDate(project.warrantyEnd)}</InfoRow>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-600'>สถานะค้ำประกัน&nbsp;:</span>
                <StatusBadge status={project.warrantyStatus} />
              </div>
            </div>
          )}

          <div className='flex justify-end gap-2 w-full mt-2'>
            <Button size='large' shape='round' onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              size='large'
              shape='round'
              onClick={handleConfirm}
              style={{
                background: 'var(--yellow)',
                color: '#000',
                borderColor: 'var(--yellow)',
                fontWeight: 700,
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(DeleteProjectModal)
