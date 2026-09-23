"use client"
import { Button } from 'antd'
import React from 'react'

interface Props {
  onCancel: () => void
  cancelText?: string
  /** Omit for a close-only footer (single gray button). */
  onConfirm?: () => void
  confirmText?: string
  confirmLoading?: boolean
  confirmDisabled?: boolean
  /** A save is in flight — locks the cancel button. */
  busy?: boolean
  /** Wrap the confirm button (e.g. in a Popconfirm). When given, the button's
   *  own click is disabled — the wrapper owns confirming. */
  wrapConfirm?: (button: React.ReactElement) => React.ReactNode
}

/** Gray cancel + yellow confirm buttons shared by the "รายการอุปกรณ์" modals. */
const EquipmentModalFooter: React.FC<Props> = ({
  onCancel,
  cancelText = 'ยกเลิก',
  onConfirm,
  confirmText = 'ยืนยัน',
  confirmLoading,
  confirmDisabled,
  busy,
  wrapConfirm,
}) => {
  const confirmButton = (
    <Button
      shape='round'
      onClick={wrapConfirm ? undefined : onConfirm}
      loading={confirmLoading}
      disabled={confirmDisabled}
      style={{
        background: '#FCD116',
        color: '#1A1A1A',
        borderColor: '#FCD116',
        padding: '8px 32px',
        height: 'auto',
        fontWeight: 600,
      }}
    >
      {confirmText}
    </Button>
  )

  return (
    <div className='flex justify-end gap-3 mt-6'>
      <Button
        shape='round'
        onClick={onCancel}
        disabled={busy}
        style={{
          background: '#E5E5E5',
          color: '#4A4A4A',
          borderColor: '#E5E5E5',
          padding: '8px 28px',
          height: 'auto',
          fontWeight: 500,
        }}
      >
        {cancelText}
      </Button>
      {onConfirm && (wrapConfirm ? wrapConfirm(confirmButton) : confirmButton)}
    </div>
  )
}

export default React.memo<Props>(EquipmentModalFooter)
