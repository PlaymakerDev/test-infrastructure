"use client"
import React, { useEffect, useRef, useState } from 'react'
import vms from '@/features/admin/vms/overall/components/vms.module.css'
import styles from './alertHistory.module.css'
import {
  TbSquarePlus,
  TbCalendar,
  TbCloudUpload,
  TbFileUpload,
  TbPlayerPause,
  TbPlayerPlay,
  TbCheck,
  TbX,
} from 'react-icons/tb'

const INSTALL_POINTS = [
  'VMS >> ฉช.4050 จุดที่ 1',
  'VMS >> ฉช.4050 จุดที่ 2',
  'ฉช.4050 - VMS จุดที่ 1',
]
const CATEGORY_OPTIONS = ['เส้นทาง', 'เทศกาล', 'แผ่นดินไหว', 'อื่นๆ']

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface CommandEditData {
  installPoint?: string
  templateName?: string
  category?: string
  startDate?: string
  endDate?: string
  contentType?: 'media' | 'text'
}

interface Props {
  open: boolean
  onClose: () => void
  editData?: CommandEditData
}

const ModalAddCommand: React.FC<Props> = ({ open, onClose, editData }) => {
  const isEdit = !!editData
  const [installPoint, setInstallPoint] = useState(editData?.installPoint ?? '')
  const [templateName, setTemplateName] = useState(editData?.templateName ?? '')
  const [category, setCategory] = useState(editData?.category ?? '')
  const [durationType, setDurationType] = useState('เริ่มต้น - สิ้นสุดตามที่กำหนด')
  const [startDate, setStartDate] = useState(editData?.startDate ?? '')
  const [endDate, setEndDate] = useState(editData?.endDate ?? '')
  const [contentType, setContentType] = useState<'media' | 'text'>(editData?.contentType ?? 'media')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isUploading || isPaused || uploadProgress >= 100) return
    const timer = setTimeout(() => {
      setUploadProgress(prev => {
        const next = prev + Math.random() * 6 + 2
        if (next >= 100) { setIsUploading(false); return 100 }
        return next
      })
    }, 180)
    return () => clearTimeout(timer)
  }, [isUploading, isPaused, uploadProgress])

  useEffect(() => {
    if (!open) return
    setInstallPoint(editData?.installPoint ?? '')
    setTemplateName(editData?.templateName ?? '')
    setCategory(editData?.category ?? '')
    setStartDate(editData?.startDate ?? '')
    setEndDate(editData?.endDate ?? '')
    setContentType(editData?.contentType ?? 'media')
    setDurationType('เริ่มต้น - สิ้นสุดตามที่กำหนด')
    setFileName(null)
    setFileSize('')
    setUploadProgress(0)
    setIsUploading(false)
    setIsPaused(false)
    setDragOver(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const startUpload = (file: File) => {
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setUploadProgress(0)
    setIsUploading(true)
    setIsPaused(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) startUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) startUpload(file)
  }

  const handleClose = () => {
    setInstallPoint('')
    setTemplateName('')
    setCategory('')
    setStartDate('')
    setEndDate('')
    setContentType('media')
    setFileName(null)
    setFileSize('')
    setUploadProgress(0)
    setIsUploading(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <span className={vms.panelIcon}>
              <TbSquarePlus size={22} color="#F8C318" />
            </span>
            <div>
              <div className={styles.modalTitle}>{isEdit ? 'แก้ไขรูปแบบการแสดงผล' : 'เพิ่มรูปแบบการแสดงผล'}</div>
              <div className={styles.modalSubtitle}>{isEdit ? 'แก้ไขรูปภาพ วิดีโอ และข้อความ' : 'เพิ่มรูปภาพ วิดีโอ และข้อความ'}</div>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={handleClose}>
            <TbX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* ข้อมูลจุดติดตั้ง */}
          <p className={vms.addFormatSectionLabel}>ข้อมูลจุดติดตั้ง</p>
          <div className={vms.addFormatField} style={{ marginBottom: 16 }}>
            <label className={vms.addFormatLabel}>จุดติดตั้ง<span className={vms.addFormatRequired}>*</span></label>
            <div className={vms.addFormatSelectWrap}>
              <select
                className={`${vms.addFormatSelect} ${installPoint ? vms.addFormatSelectFilled : ''}`}
                value={installPoint}
                onChange={e => setInstallPoint(e.target.value)}
              >
                <option value="">กรุณาเลือกจุดติดตั้ง...</option>
                {INSTALL_POINTS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className={vms.addFormatSelectChevron}>▾</span>
            </div>
          </div>

          {/* ข้อมูลการแสดงผล */}
          <p className={vms.addFormatSectionLabel}>ข้อมูลการแสดงผล</p>
          <div className={vms.addFormatRow}>
            <div className={vms.addFormatField}>
              <label className={vms.addFormatLabel}>ชื่อรูปแบบ<span className={vms.addFormatRequired}>*</span></label>
              <input
                className={vms.addFormatInput}
                placeholder="กรุณากรอกชื่อรูปแบบ..."
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
              />
            </div>
            <div className={vms.addFormatField}>
              <label className={vms.addFormatLabel}>หมวดหมู่<span className={vms.addFormatRequired}>*</span></label>
              <div className={vms.addFormatSelectWrap}>
                <select
                  className={`${vms.addFormatSelect} ${category ? vms.addFormatSelectFilled : ''}`}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">กรุณาเลือกหมวดหมู่...</option>
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className={vms.addFormatSelectChevron}>▾</span>
              </div>
            </div>
          </div>

          {/* ระยะเวลา */}
          <p className={vms.addFormatSectionLabel}>ระยะเวลา</p>
          <div className={vms.addFormatField} style={{ marginBottom: 12 }}>
            <label className={vms.addFormatLabel}>ระยะเวลาเริ่มต้นการแสดงผล<span className={vms.addFormatRequired}>*</span></label>
            <div className={vms.addFormatSelectWrap}>
              <select
                className={`${vms.addFormatSelect} ${vms.addFormatSelectFilled}`}
                value={durationType}
                onChange={e => setDurationType(e.target.value)}
              >
                <option value="เริ่มต้น - สิ้นสุดตามที่กำหนด">เริ่มต้น - สิ้นสุดตามที่กำหนด</option>
                <option value="ทันที">ทันที</option>
                <option value="กำหนดเอง">กำหนดเอง</option>
              </select>
              <span className={vms.addFormatSelectChevron}>▾</span>
            </div>
          </div>
          <div className={vms.addFormatRow}>
            <div className={vms.addFormatField}>
              <label className={vms.addFormatLabel}>เริ่มต้นการแสดงผล<span className={vms.addFormatRequired}>*</span></label>
              <div className={vms.addFormatDateWrap}>
                <input
                  ref={startDateRef}
                  type="date"
                  className={`${vms.addFormatDateInput} ${!startDate ? vms.addFormatDateEmpty : ''}`}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                {!startDate && <span className={vms.addFormatDatePlaceholder}>กรุณาเลือกวันที่และเวลาเริ่มต้น...</span>}
                <span className={vms.addFormatDateIcon} onClick={() => startDateRef.current?.showPicker()}>
                  <TbCalendar size={16} />
                </span>
              </div>
            </div>
            <div className={vms.addFormatField}>
              <label className={vms.addFormatLabel}>สิ้นสุดการแสดงผล<span className={vms.addFormatRequired}>*</span></label>
              <div className={vms.addFormatDateWrap}>
                <input
                  ref={endDateRef}
                  type="date"
                  className={`${vms.addFormatDateInput} ${!endDate ? vms.addFormatDateEmpty : ''}`}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
                {!endDate && <span className={vms.addFormatDatePlaceholder}>กรุณาเลือกวันที่และเวลาสิ้นสุด...</span>}
                <span className={vms.addFormatDateIcon} onClick={() => endDateRef.current?.showPicker()}>
                  <TbCalendar size={16} />
                </span>
              </div>
            </div>
          </div>

          {/* เนื้อหาและรายละเอียด */}
          <p className={vms.addFormatSectionLabel}>เนื้อหาและรายละเอียด</p>
          <div className={vms.addFormatRadioGroup}>
            <label className={vms.addFormatRadioLabel}>
              <input type="radio" name="modal-contentType" className={vms.addFormatRadio} checked={contentType === 'media'} onChange={() => setContentType('media')} />
              รูปภาพหรือวิดีโอ
            </label>
            <label className={vms.addFormatRadioLabel}>
              <input type="radio" name="modal-contentType" className={vms.addFormatRadio} checked={contentType === 'text'} onChange={() => setContentType('text')} />
              ข้อความ
            </label>
          </div>

          {contentType === 'media' && (
            <>
              <p className={vms.addFormatSectionLabel} style={{ marginBottom: 2, color: uploadProgress >= 100 ? '#22c55e' : undefined }}>
                {uploadProgress >= 100 ? 'อัปโหลดสำเร็จ' : fileName ? 'ไฟล์ที่อัปโหลด' : 'อัปโหลดไฟล์'}
              </p>
              <p className={vms.addFormatDesc} style={{ marginBottom: 8, marginLeft: 0 }}>
                {uploadProgress >= 100 ? 'ไฟล์พร้อมใช้งานแล้ว' : fileName ? 'ตรวจสอบไฟล์ที่อัปโหลดล่าสุด' : 'ลากและวางไฟล์ที่นี่เพื่อดำเนินการต่อ'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/avi,video/quicktime,image/jpeg,image/png,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {fileName ? (
                <div className={vms.uploadProgressCard}>
                  <div className={vms.uploadProgressIcon}>
                    <TbFileUpload size={22} color="#66AEFF" />
                  </div>
                  <div className={vms.uploadProgressBody}>
                    <div className={vms.uploadProgressName}>{fileName}</div>
                    <div className={vms.uploadProgressTrack}>
                      <div
                        className={`${vms.uploadProgressFill} ${uploadProgress >= 100 ? vms.uploadProgressFillDone : ''}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className={vms.uploadProgressMeta}>
                      <span>{fileSize}</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                  </div>
                  {uploadProgress >= 100 ? (
                    <div className={vms.uploadSuccessBadge}>
                      <TbCheck size={14} />
                      อัปโหลดสำเร็จ
                    </div>
                  ) : (
                    <button
                      className={vms.uploadProgressPauseBtn}
                      type="button"
                      onClick={() => setIsPaused(p => !p)}
                      title={isPaused ? 'ดำเนินการต่อ' : 'หยุดชั่วคราว'}
                    >
                      {isPaused ? <TbPlayerPlay size={16} /> : <TbPlayerPause size={16} />}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`${vms.addFormatDropzone} ${dragOver ? vms.addFormatDropzoneActive : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <TbCloudUpload size={44} color="#8c8c9e" style={{ marginBottom: 8 }} />
                  <span className={vms.addFormatDropzoneText}>ลากหรือวางไฟล์</span>
                  <span className={vms.addFormatDropzoneHint}>ไฟล์ที่รับรูปแบบ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={vms.btnSecondary} type="button" onClick={handleClose}>ยกเลิก</button>
          <button className={vms.btnPrimary} type="button">{isEdit ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
        </div>

      </div>
    </div>
  )
}

export default React.memo(ModalAddCommand)
