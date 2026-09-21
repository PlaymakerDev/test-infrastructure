"use client"
import { ConfigProvider, Modal } from 'antd'
import React from 'react'

interface Props {
  open: boolean
  onClose: () => void
  /** Kind label, e.g. "Traffic Signal". */
  title: React.ReactNode
  /** Install-point name under the title. */
  subtitle?: React.ReactNode
  /** Right-aligned slot in the header row (e.g. an "เพิ่มอุปกรณ์" button). */
  headerExtra?: React.ReactNode
  width?: number
  children: React.ReactNode
}

/** Dark frame shared by every "รายการอุปกรณ์" modal (CCTV list, camera select,
 *  Traffic Signal, VMS): the Modal + Table theme tokens, the title / install-
 *  point header, and the modal chrome — previously copy-pasted into each. */
const EquipmentModalShell: React.FC<Props> = ({
  open,
  onClose,
  title,
  subtitle,
  headerExtra,
  width = 1200,
  children,
}) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#1A1A1A',
            headerBg: '#1A1A1A',
            footerBg: '#1A1A1A',
            colorIcon: '#FFF',
            titleColor: '#66AEFF',
            borderRadiusLG: 16,
          },
          Table: {
            headerBg: '#66AEFF',
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(252,209,22,0.25)',
            rowHoverBg: 'rgba(255,255,255,0.04)',
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={width}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          container: { padding: '28px 32px', borderRadius: 16, background: '#1A1A1A' },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={null}
      >
        <div className='flex items-start justify-between gap-4 mb-4'>
          <div className='flex-1 min-w-0'>
            <h2 className='text-(--default-blue) text-2xl font-bold m-0 mb-1.5'>{title}</h2>
            <p className='text-white/75 fs-12 break-words m-0'>{subtitle}</p>
          </div>
          {headerExtra}
        </div>
        {children}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(EquipmentModalShell)
