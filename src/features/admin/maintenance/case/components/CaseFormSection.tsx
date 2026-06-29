"use client"
import React from 'react'
import { Button, ConfigProvider, DatePicker, Input, Select, Upload } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbChevronDown, TbFileText, TbPrinter, TbTrash } from 'react-icons/tb'
import styles from '../screen/maintenance-case.module.css'

dayjs.extend(buddhistEra)
dayjs.locale('th')

export interface CaseFormState {
  category: string
  agency: string
  problem: string
  solution: string
  reportDate: string
  inspectDate: string
  beforeImages: number
  afterImages: number
}

interface Props {
  formData: CaseFormState
  closeCaseAfterSave: boolean
  onFormChange: (patch: Partial<CaseFormState>) => void
  onToggleCloseCase: () => void
  onSave: () => void
}

const ImageUploadPanel: React.FC<{
  label: string
  count: number
  onDelete: (index: number) => void
}> = ({ label, count, onDelete }) => (
  <>
    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '12px 0 4px 0' }}>
      {label}<span style={{ color: '#E94C4C' }}>*</span>
    </p>
    <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: '0 0 8px 0' }}>ลากและวางที่นี่เพื่อดำเนินการต่อ</p>
    <Upload.Dragger
      style={{ background: 'transparent', border: '1px dashed #FCD116', borderRadius: 10, height: 120, textAlign: 'center' }}
      className='maintenance-upload-dragger'
      accept='.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.pdf'
    >
      <img src='/atlas/images/Maintenance/cloud-upload.png' alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
      <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
      <p style={{ color: '#7C7C7C', fontWeight: 400, fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์วิดีโอ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF หรือไฟล์ PDF</p>
    </Upload.Dragger>
    {count > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={styles.imagePreviewItem} style={{ background: '#2A2A2A' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src='/atlas/images/Maintenance/iccf.png' alt='' width={32} height={32} style={{ opacity: 0.5 }} />
            </div>
            <div className={styles.imagePreviewOverlay} onClick={() => onDelete(index)}>
              <TbTrash size={24} color='#FFFFFF' />
            </div>
          </div>
        ))}
        <div className={styles.imagePreviewItem} style={{ background: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <TbFileText size={24} color='#000000' />
          <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
          <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
        </div>
      </div>
    )}
  </>
)

const CATEGORY_OPTIONS = [
  { label: 'CCTV', value: 'cctv' },
  { label: 'Traffic Volume', value: 'traffic_volume' },
  { label: 'Incident Detection', value: 'incident_detection' },
  { label: 'Traffic Signal', value: 'traffic_signal' },
  { label: 'Traffic Lighting', value: 'traffic_lighting' },
  { label: 'VMS', value: 'vms' },
]

const AGENCY_OPTIONS = [
  { label: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', value: 'agency_1' },
  { label: 'สทช. 1 (ปทุมธานี)', value: 'agency_2' },
  { label: 'สทช. 2 (นนทบุรี)', value: 'agency_3' },
  { label: 'สทช. 3 (สมุทรปราการ)', value: 'agency_4' },
]

const CaseFormSection: React.FC<Props> = ({ formData, closeCaseAfterSave, onFormChange, onToggleCloseCase, onSave }) => {
  const hasData = Boolean(
    formData.category || formData.agency || formData.problem ||
    formData.solution || formData.reportDate || formData.inspectDate,
  )

  return (
    <div
      style={{
        flex: '0 0 70%',
        minHeight: 200,
        borderRadius: 20,
        background: '#333333',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        {/* Left: form fields */}
        <div style={{ flex: `0 0 calc(70% - 16px * 0.3)`, borderRadius: 16, background: '#191919', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 8 }}>
            <img src='/atlas/images/Maintenance/iccf.png' alt='' width={30} height={30} />
            <div>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: 0 }}>บันทึกแจ้งซ่อม</p>
              <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: 0, marginTop: -4 }}>เพิ่มรายละเอียดปัญหาหรือสาเหตุที่พบ แนบรูปภาพหรือวิดีโอ</p>
            </div>
          </div>
          <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16, paddingLeft: 38 }}>ข้อมูลการแจ้งซ่อม</p>
          <div style={{ paddingLeft: 38, marginTop: 12, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
              <Select
                placeholder='กรุณาเลือกหมวดหมู่...'
                style={{ width: '100%', height: 40, borderRadius: 10 }}
                suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                value={formData.category || undefined}
                onChange={(value) => onFormChange({ category: value })}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบหรือมอบหมาย<span style={{ color: '#E94C4C' }}>*</span></p>
              <Select
                placeholder='กรุณาเลือกหน่วยงาน...'
                style={{ width: '100%', height: 40, borderRadius: 10 }}
                suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                value={formData.agency || undefined}
                onChange={(value) => onFormChange({ agency: value })}
                options={AGENCY_OPTIONS}
              />
            </div>
          </div>
          <div style={{ paddingLeft: 38, marginTop: 12 }}>
            <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
            <Input.TextArea
              placeholder='กรุณาระบุปัญหาที่พบ...'
              style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
              autoSize={{ minRows: 3, maxRows: 5 }}
              value={formData.problem}
              onChange={(e) => onFormChange({ problem: e.target.value })}
            />
          </div>
          <div style={{ paddingLeft: 38, marginTop: 12 }}>
            <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข<span style={{ color: '#E94C4C' }}>*</span></p>
            <Input.TextArea
              placeholder='กรุณาระบุวิธีการแก้ไข...'
              style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
              autoSize={{ minRows: 3, maxRows: 5 }}
              value={formData.solution}
              onChange={(e) => onFormChange({ solution: e.target.value })}
            />
          </div>
          <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16, paddingLeft: 38 }}>ระยะเวลา</p>
          <ConfigProvider locale={thTH}>
            <div style={{ paddingLeft: 38, marginTop: 12, display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
                <DatePicker
                  placeholder='กรุณาเลือกวันที่...'
                  format='DD MMM BBBB'
                  style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                  suffixIcon={<img src='/atlas/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                  value={formData.reportDate ? dayjs(formData.reportDate, 'DD MMM BBBB', 'th') : null}
                  onChange={(date) => onFormChange({ reportDate: date ? date.format('DD MMM BBBB') : '' })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ<span style={{ color: '#E94C4C' }}>*</span></p>
                <DatePicker
                  placeholder='กรุณาเลือกวันที่...'
                  format='DD MMM BBBB'
                  style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                  suffixIcon={<img src='/atlas/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                  value={formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th') : null}
                  onChange={(date) => onFormChange({ inspectDate: date ? date.format('DD MMM BBBB') : '' })}
                />
              </div>
            </div>
          </ConfigProvider>
        </div>
        {/* Right: image upload */}
        <div style={{ flex: `0 0 calc(30% - 16px * 0.7)`, borderRadius: 16, background: '#191919', padding: 20, display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0 }}>รูปภาพหรือวิดิโอ</p>
          <ImageUploadPanel
            label='ก่อนซ่อม'
            count={formData.beforeImages}
            onDelete={() => onFormChange({ beforeImages: formData.beforeImages - 1 })}
          />
          <ImageUploadPanel
            label='หลังซ่อม'
            count={formData.afterImages}
            onDelete={() => onFormChange({ afterImages: formData.afterImages - 1 })}
          />
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: hasData ? 'flex-start' : 'flex-end', gap: 12, marginTop: 'auto' }}>
        {hasData && (
          <div
            onClick={onToggleCloseCase}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              marginRight: 'auto',
              padding: '6px 16px',
              borderRadius: 50,
              border: `1px solid ${closeCaseAfterSave ? '#05F2DB' : '#555'}`,
              background: closeCaseAfterSave ? 'rgba(5, 242, 219, 0.1)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: closeCaseAfterSave ? '#05F2DB' : '#3C3C3C',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  position: 'absolute',
                  top: 1,
                  left: closeCaseAfterSave ? 18 : 2,
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            <span style={{ color: closeCaseAfterSave ? '#05F2DB' : '#999', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              ปิด Case หลังบันทึก
            </span>
          </div>
        )}
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button type='primary' size='small' shape='round' icon={<TbPrinter />} style={{ height: 31 }}>
            นำออกเอกสาร
          </Button>
        </ConfigProvider>
        <button className={styles.btnSecondary} style={{ background: '#C4C4C4', color: '#000000' }}>ยกเลิก</button>
        <button
          className={styles.btnPrimary}
          onClick={onSave}
          style={hasData ? { background: '#05F2DB', color: '#000000' } : undefined}
        >
          {hasData ? 'บันทึก + ปิด Case' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}

export default React.memo(CaseFormSection)
