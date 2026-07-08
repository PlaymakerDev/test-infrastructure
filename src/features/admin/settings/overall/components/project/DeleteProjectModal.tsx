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

// ---------------------------------------------------------------------------
// Figma tokens (drr-atlas-doc/3.jpg — delete confirm).
// ---------------------------------------------------------------------------
const YELLOW = '#FCD116'
const RED = '#FF3B3B'
const RED_BORDER = '#FF6B6B'
const RED_TINT = '#FFECEC'
const LABEL_MUTED = '#6B6B6B'
const VALUE_FG = '#1F1F1F'
const CANCEL_BG = '#E5E5E5'
const CANCEL_FG = '#4A4A4A'

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start' style={{ gap: 8, fontSize: 14 }}>
    <span style={{ color: LABEL_MUTED, flexShrink: 0 }}>{label}&nbsp;:</span>
    <span style={{ color: VALUE_FG, wordBreak: 'break-word' }}>{children}</span>
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
  const { deleteProject, isSubmitting } = useOverallContext()

  const handleConfirm = async () => {
    if (!project) return
    try {
      await deleteProject(project.id)
      onClose()
    } catch {
      // context already surfaced the error via message.error — keep the modal
      // open so the user can retry without re-selecting the row.
    }
  }

  const handleCancel = () => {
    if (isSubmitting) return
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
        width={620}
        centered
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !isSubmitting }}
        keyboard={!isSubmitting}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          body: { padding: '32px 40px' },
        }}
      >
        <div className='flex flex-col items-center' style={{ gap: 16 }}>
          <div
            className='rounded-full flex items-center justify-center'
            style={{
              width: 56,
              height: 56,
              border: `2px solid ${RED}`,
            }}
          >
            <TbAlertCircle size={32} color={RED} />
          </div>
          <div className='text-center'>
            <h3
              style={{
                color: VALUE_FG,
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              ยืนยันลบโครงการหรือไม่?
            </h3>
            <p
              style={{
                color: '#8A8A8A',
                fontSize: 13,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {project && (
            <div
              className='w-full rounded-xl'
              style={{
                border: `1px solid ${RED_BORDER}`,
                background: RED_TINT,
                padding: 16,
                marginTop: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <InfoRow label='ชื่อโครงการ'>{project.name}</InfoRow>
              <InfoRow label='ปีงบประมาณ'>{project.budgetYear}</InfoRow>
              <InfoRow label='เลขที่สัญญา'>{project.contractNo}</InfoRow>
              <InfoRow label='ผู้ว่าจ้าง'>{project.owner}</InfoRow>
              <InfoRow label='ผู้รับจ้าง'>{project.contractor}</InfoRow>
              <InfoRow label='วันที่เริ่มต้นค้ำประกัน'>{formatBuddhistDate(project.warrantyStart)}</InfoRow>
              <InfoRow label='วันที่สิ้นสุดค้ำประกัน'>{formatBuddhistDate(project.warrantyEnd)}</InfoRow>
              <div className='flex items-center' style={{ gap: 8, fontSize: 14 }}>
                <span style={{ color: LABEL_MUTED }}>สถานะค้ำประกัน&nbsp;:</span>
                <StatusBadge status={project.warrantyStatus} />
              </div>
            </div>
          )}

          <div className='flex justify-end w-full' style={{ gap: 12, marginTop: 4 }}>
            <Button
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                background: CANCEL_BG,
                color: CANCEL_FG,
                border: 'none',
                borderRadius: 999,
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirm}
              loading={isSubmitting}
              style={{
                background: YELLOW,
                color: '#1A1A1A',
                border: 'none',
                borderRadius: 999,
                padding: '10px 32px',
                height: 'auto',
                fontWeight: 600,
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
