"use client"
import React from 'react'
import styles from './alertHistory.module.css'

export interface DeleteCommandData {
  sign: string
  category: string
  agency: string
  date: string
  timeRange: string
  duration: string
}

interface Props {
  open: boolean
  onClose: () => void
  data?: DeleteCommandData
  onConfirm?: () => void
}

const ModalDeleteCommand: React.FC<Props> = ({ open, onClose, data, onConfirm }) => {
  if (!open || !data) return null

  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.deleteModalCard} onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className={styles.deleteModalIconWrap}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Title */}
        <div className={styles.deleteModalTitle}>ยืนยันลบคำสั่งนี้หรือไม่?</div>
        <div className={styles.deleteModalSub}>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</div>

        {/* Info Box */}
        <div className={styles.deleteInfoBox}>
          <div className={styles.deleteInfoRow}>
            <span className={styles.deleteInfoLabel}>จุดติดตั้ง :</span>
            <span>{data.sign}</span>
          </div>
          <div className={styles.deleteInfoRow}>
            <span className={styles.deleteInfoLabel}>หมวดหมู่ :</span>
            <span className={styles.deleteInfoHighlight}>{data.category}</span>
          </div>
          <div className={styles.deleteInfoRow}>
            <span className={styles.deleteInfoLabel}>หน่วยงานรับผิดชอบ :</span>
            <span>{data.agency}</span>
          </div>
          <div className={styles.deleteInfoRow}>
            <span className={styles.deleteInfoLabel}>ระยะเวลาแสดงผล :</span>
            <span>{data.date} {data.timeRange} น. ({data.duration})</span>
          </div>
          <div className={styles.deleteInfoRow}>
            <span className={styles.deleteInfoLabel}>สถานะการแสดงผล :</span>
            <span className={styles.deleteInfoStatus}>รอดำเนินการ ({data.duration})</span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.deleteModalFooter}>
          <button className={styles.deleteBtnCancel} type="button" onClick={onClose}>ยกเลิก</button>
          <button className={styles.deleteBtnConfirm} type="button" onClick={handleConfirm}>ยืนยัน</button>
        </div>

      </div>
    </div>
  )
}

export default React.memo(ModalDeleteCommand)
