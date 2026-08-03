"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'
import type { Contractor } from '../../types/contractor'

interface Props {
  open: boolean
  contractor: Contractor | null
  deleting?: boolean
  onClose: () => void
  onConfirm: (id: string) => void
}

/** Figma tokens shared by both delete variants. Kept top-level so both
 *  branches (in-use / confirm) stay in visual lockstep with frame 3 & 11. */
const TOKENS = {
  labelText: '#6B6B6B',
  valueText: '#1F1F1F',
  titleText: '#1F1F1F',
  subtitleText: '#8A8A8A',
  // Delete-red variant (safe-to-delete confirmation, frame 3)
  redBorder: '#FF6B6B',
  redBg: '#FFECEC',
  redIcon: '#FF3B3B',
  // Cannot-delete orange variant (frame 11)
  orangeBorder: '#F59E0B',
  orangeBg: '#FFF7ED',
  orangeIcon: '#F59E0B',
  cancelBg: '#E5E5E5',
  cancelText: '#4A4A4A',
  confirmBg: '#FCD116',
  confirmText: '#1A1A1A',
} as const

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2' style={{ fontSize: "var(--fs-12)" }}>
    <span style={{ color: TOKENS.labelText, flexShrink: 0 }}>{label}&nbsp;:</span>
    <span style={{ color: TOKENS.valueText, wordBreak: 'break-word' }}>{children}</span>
  </div>
)

/** Two branches: (1) contractor is used by ≥1 project → block delete with an
 *  orange alert; (2) safe to delete → red confirmation prompt. The
 *  "in-use" count is derived on the client from the projects list — the
 *  backend has no dedicated field for it, so this is preflight only. If the
 *  server still refuses (e.g. FK constraint we missed), the mutation error
 *  is surfaced by the parent's message.error toast. */
const DeleteContactModal: React.FC<Props> = ({
  open,
  contractor,
  deleting,
  onClose,
  onConfirm,
}) => {
  const inUse = !!contractor && contractor.projectCount > 0

  const handleConfirm = () => {
    if (contractor) onConfirm(contractor.id)
  }

  const themeConfig = {
    components: {
      Modal: {
        contentBg: '#FFFFFF',
        headerBg: '#FFFFFF',
        footerBg: '#FFFFFF',
        borderRadiusLG: 16,
        paddingContentHorizontalLG: 40,
        paddingLG: 32,
      },
    },
  }

  if (inUse && contractor) {
    return (
      <ConfigProvider theme={themeConfig}>
        <Modal
          wrapClassName='light-modal'
          open={open}
          onCancel={onClose}
          footer={null}
          destroyOnHidden
          width={620}
          closable={{ 'aria-label': 'Custom Close Button' }}
          mask={{ closable: true }}
          styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
        >
          <div className='flex flex-col items-center py-2' style={{ gap: 20 }}>
            <div
              className='rounded-full flex items-center justify-center'
              style={{
                width: 56,
                height: 56,
                border: `2px solid ${TOKENS.orangeIcon}`,
              }}
            >
              <TbAlertCircle size={34} color={TOKENS.orangeIcon} />
            </div>
            <div className='text-center'>
              <h3
                className='m-0'
                style={{ color: TOKENS.titleText, fontSize: 18, fontWeight: 600 }}
              >
                ไม่สามารถลบผู้รับจ้างได้
              </h3>
              <p
                className='mt-1 mb-0'
                style={{ color: TOKENS.subtitleText, fontSize: "var(--fs-12)" }}
              >
                ผู้รับจ้างรายนี้กำลังถูกใช้งานอยู่ใน{' '}
                <span style={{ color: TOKENS.titleText, fontWeight: 600 }}>
                  {contractor.projectCount.toLocaleString()}
                </span>{' '}
                โครงการ กรุณาลบหรือย้ายโครงการที่เกี่ยวข้องก่อน
              </p>
            </div>

            <div
              className='w-full rounded-xl'
              style={{
                border: `1px solid ${TOKENS.orangeBorder}`,
                background: TOKENS.orangeBg,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <InfoRow label='ชื่อบริษัท'>{contractor.companyName}</InfoRow>
              <InfoRow label='ชื่อย่อ'>{contractor.shortName || '-'}</InfoRow>
              <InfoRow label='ผู้ติดต่อ'>{contractor.contactPerson || '-'}</InfoRow>
              <InfoRow label='จำนวนโครงการที่ใช้งาน'>
                {contractor.projectCount.toLocaleString()}
              </InfoRow>
            </div>

            <div className='flex justify-end w-full'>
              <Button
                onClick={onClose}
                style={{
                  background: TOKENS.confirmBg,
                  color: TOKENS.confirmText,
                  border: 'none',
                  borderRadius: 999,
                  padding: '10px 32px',
                  height: 'auto',
                  fontWeight: 600,
                }}
              >
                รับทราบ
              </Button>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={620}
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !deleting }}
        keyboard={!deleting}
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        <div className='flex flex-col items-center py-2' style={{ gap: 20 }}>
          <div
            className='rounded-full flex items-center justify-center'
            style={{
              width: 56,
              height: 56,
              border: `2px solid ${TOKENS.redIcon}`,
            }}
          >
            <TbAlertCircle size={34} color={TOKENS.redIcon} />
          </div>
          <div className='text-center'>
            <h3
              className='m-0'
              style={{ color: TOKENS.titleText, fontSize: 18, fontWeight: 600 }}
            >
              ยืนยันลบผู้รับจ้างหรือไม่?
            </h3>
            <p
              className='mt-1 mb-0'
              style={{ color: TOKENS.subtitleText, fontSize: "var(--fs-12)" }}
            >
              ระบบจะลบข้อมูลโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {contractor && (
            <div
              className='w-full rounded-xl'
              style={{
                border: `1px solid ${TOKENS.redBorder}`,
                background: TOKENS.redBg,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <InfoRow label='ชื่อบริษัท'>{contractor.companyName}</InfoRow>
              <InfoRow label='ชื่อย่อ'>{contractor.shortName || '-'}</InfoRow>
              <InfoRow label='ผู้ติดต่อ'>{contractor.contactPerson || '-'}</InfoRow>
              <InfoRow label='เบอร์โทรศัพท์'>{contractor.phone || '-'}</InfoRow>
            </div>
          )}

          <div className='flex justify-end w-full' style={{ gap: 12 }}>
            <Button
              onClick={onClose}
              disabled={deleting}
              style={{
                background: TOKENS.cancelBg,
                color: TOKENS.cancelText,
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
              loading={deleting}
              style={{
                background: TOKENS.confirmBg,
                color: TOKENS.confirmText,
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

export default React.memo<Props>(DeleteContactModal)
