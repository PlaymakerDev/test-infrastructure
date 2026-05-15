"use client"
import React, { useEffect, useRef, useState } from 'react'
import styles from './vms.module.css'
import {
  TbSquarePlus,
  TbCalendar,
  TbCloudUpload,
  TbFileUpload,
  TbPlayerPause,
  TbPlayerPlay,
  TbCheck,
} from 'react-icons/tb'

const CATEGORY_OPTIONS = ['เส้นทาง', 'เทศกาล', 'แผ่นดินไหว', 'อื่นๆ']

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const AddDisplayFormatVms: React.FC = () => {
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState('')
  const [durationType, setDurationType] = useState('เริ่มต้น - สิ้นสุดตามที่กำหนด')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [contentType, setContentType] = useState<'media' | 'text'>('media')
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

  const resetAll = () => {
    setTemplateName('')
    setCategory('')
    setStartDate('')
    setEndDate('')
    setContentType('media')
    setFileName(null)
    setFileSize('')
    setUploadProgress(0)
    setIsUploading(false)
    setIsPaused(false)
  }

  return (
    <div className={styles.addFormatPanel}>
      {/* Panel Header */}
      <div className={styles.panelHeader} style={{ marginBottom: 4 }}>
        <span className={styles.panelIcon}>
          <TbSquarePlus size={22} color="#F8C318" />
        </span>
        <span className={styles.panelTitle}>เพิ่มรูปแบบการแสดงผล</span>
      </div>
      <p className={styles.addFormatDesc}>เพิ่มรูปภาพ วิดีโอ และข้อความ</p>

      {/* Section: ข้อมูลการแสดงผล */}
      <p className={styles.addFormatSectionLabel}>ข้อมูลการแสดงผล</p>
      <div className={styles.addFormatRow}>
        <div className={styles.addFormatField}>
          <label className={styles.addFormatLabel}>ชื่อรูปแบบ<span className={styles.addFormatRequired}>*</span></label>
          <input
            className={styles.addFormatInput}
            placeholder="กรุณากรอกชื่อรูปแบบ..."
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
          />
        </div>
        <div className={styles.addFormatField}>
          <label className={styles.addFormatLabel}>หมวดหมู่<span className={styles.addFormatRequired}>*</span></label>
          <div className={styles.addFormatSelectWrap}>
            <select
              className={`${styles.addFormatSelect} ${category ? styles.addFormatSelectFilled : ''}`}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">กรุณาเลือกหมวดหมู่...</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className={styles.addFormatSelectChevron}>▾</span>
          </div>
        </div>
      </div>

      {/* Section: ระยะเวลา */}
      <p className={styles.addFormatSectionLabel}>ระยะเวลา</p>
      <div className={styles.addFormatField} style={{ marginBottom: 12 }}>
        <label className={styles.addFormatLabel}>ระยะเวลาเริ่มต้นการแสดงผล<span className={styles.addFormatRequired}>*</span></label>
        <div className={styles.addFormatSelectWrap}>
          <select
            className={`${styles.addFormatSelect} ${styles.addFormatSelectFilled}`}
            value={durationType}
            onChange={e => setDurationType(e.target.value)}
          >
            <option value="เริ่มต้น - สิ้นสุดตามที่กำหนด">เริ่มต้น - สิ้นสุดตามที่กำหนด</option>
            <option value="ทันที">ทันที</option>
            <option value="กำหนดเอง">กำหนดเอง</option>
          </select>
          <span className={styles.addFormatSelectChevron}>▾</span>
        </div>
      </div>

      <div className={styles.addFormatRow}>
        <div className={styles.addFormatField}>
          <label className={styles.addFormatLabel}>เริ่มต้นการแสดงผล<span className={styles.addFormatRequired}>*</span></label>
          <div className={styles.addFormatDateWrap}>
            <input
              ref={startDateRef}
              type="date"
              className={`${styles.addFormatDateInput} ${!startDate ? styles.addFormatDateEmpty : ''}`}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            {!startDate && <span className={styles.addFormatDatePlaceholder}>กรุณาเลือกวันที่และเวลาเริ่มต้น...</span>}
            <span className={styles.addFormatDateIcon} onClick={() => startDateRef.current?.showPicker()}>
              <TbCalendar size={16} />
            </span>
          </div>
        </div>
        <div className={styles.addFormatField}>
          <label className={styles.addFormatLabel}>สิ้นสุดการแสดงผล<span className={styles.addFormatRequired}>*</span></label>
          <div className={styles.addFormatDateWrap}>
            <input
              ref={endDateRef}
              type="date"
              className={`${styles.addFormatDateInput} ${!endDate ? styles.addFormatDateEmpty : ''}`}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            {!endDate && <span className={styles.addFormatDatePlaceholder}>กรุณาเลือกวันที่และเวลาสิ้นสุด...</span>}
            <span className={styles.addFormatDateIcon} onClick={() => endDateRef.current?.showPicker()}>
              <TbCalendar size={16} />
            </span>
          </div>
        </div>
      </div>

      {/* Section: เนื้อหาและรายละเอียด */}
      <p className={styles.addFormatSectionLabel}>เนื้อหาและรายละเอียด</p>
      <div className={styles.addFormatRadioGroup}>
        <label className={styles.addFormatRadioLabel}>
          <input type="radio" name="contentType" className={styles.addFormatRadio} checked={contentType === 'media'} onChange={() => setContentType('media')} />
          รูปภาพหรือวิดีโอ
        </label>
        <label className={styles.addFormatRadioLabel}>
          <input type="radio" name="contentType" className={styles.addFormatRadio} checked={contentType === 'text'} onChange={() => setContentType('text')} />
          ข้อความ
        </label>
      </div>

      {contentType === 'media' && (
        <>
          <p className={styles.addFormatSectionLabel} style={{ marginBottom: 2, color: uploadProgress >= 100 ? '#22c55e' : undefined }}>
            {uploadProgress >= 100 ? 'อัปโหลดสำเร็จ' : fileName ? 'ไฟล์ที่อัปโหลด' : 'อัปโหลดไฟล์'}
          </p>
          <p className={styles.addFormatDesc} style={{ marginBottom: 8, marginLeft: 0 }}>
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
            <div className={styles.uploadProgressCard}>
              {/* File icon */}
              <div className={styles.uploadProgressIcon}>
                <TbFileUpload size={22} color="#66AEFF" />
              </div>

              {/* Progress info */}
              <div className={styles.uploadProgressBody}>
                <div className={styles.uploadProgressName}>{fileName}</div>
                <div className={styles.uploadProgressTrack}>
                  <div
                    className={`${styles.uploadProgressFill} ${uploadProgress >= 100 ? styles.uploadProgressFillDone : ''}`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className={styles.uploadProgressMeta}>
                  <span>{fileSize}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              </div>

              {/* Pause / success indicator */}
              {uploadProgress >= 100 ? (
                <div className={styles.uploadSuccessBadge}>
                  <TbCheck size={14} />
                  อัปโหลดสำเร็จ
                </div>
              ) : (
                <button
                  className={styles.uploadProgressPauseBtn}
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
              className={`${styles.addFormatDropzone} ${dragOver ? styles.addFormatDropzoneActive : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <TbCloudUpload size={44} color="#8c8c9e" style={{ marginBottom: 8 }} />
              <span className={styles.addFormatDropzoneText}>ลากหรือวางไฟล์</span>
              <span className={styles.addFormatDropzoneHint}>ไฟล์ที่รับรูปแบบ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF</span>
            </div>
          )}
        </>
      )}

      {/* Footer Buttons */}
      <div className={styles.addFormatFooter}>
        <button className={styles.btnSecondary} type="button" onClick={resetAll}>ยกเลิก</button>
        <button className={styles.btnPrimary} type="button">บันทึก</button>
      </div>
    </div>
  )
}

export default React.memo(AddDisplayFormatVms)
