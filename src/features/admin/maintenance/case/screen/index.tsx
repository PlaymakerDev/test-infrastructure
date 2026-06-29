"use client"
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { App, Button, ConfigProvider, DatePicker, Input, Select, Spin, Upload } from 'antd'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TbChevronDown, TbFileText, TbPrinter, TbTrash } from 'react-icons/tb'
import styles from './maintenance-case.module.css'
import ModalSaveSuccess from '../components/ModalSaveSuccess'
import { TitleSection } from '../components'
import { getMaintenanceCaseAPI, updateMaintenanceCaseAPI } from '@/services/routes/MaintenanceService'
import type { CaseDetail } from '@/types/maintenance'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

type RepairStatus = 'pending' | 'in_progress' | 'completed'
type WarrantyStatus = 'active' | 'expired'

interface ProjectInfo {
  projectName: string
  contractor: string
  agency: string
  contractNo: string
  warrantyStart: string
  warrantyEnd: string
  warrantyStatus: WarrantyStatus
}

interface DeviceInfo {
  deviceName: string
  deviceType: string
  installPoint: string
  ipAddress: string
  offlineDate: string
  offlineDays: number
  hasLive: boolean
}

const REPAIR_STATUS_CONFIG: Record<RepairStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'ยังไม่มีการตรวจเช็ค', color: '#E94C4C', bg: '#E94C4C1A' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#66AEFF', bg: '#66AEFF1A' },
  completed: { label: 'เสร็จสิ้น', color: '#66AEFF', bg: '#66AEFF33' },
}

const CaseContent: React.FC<Props> = ({ id }) => {
  const { modal } = App.useApp()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    category: '',
    agency: '',
    problem: '',
    solution: '',
    reportDate: '',
    inspectDate: '',
    beforeImages: 0,
    afterImages: 0,
  })
  const [closeCaseAfterSave, setCloseCaseAfterSave] = useState(false)

  const fetchCase = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getMaintenanceCaseAPI(id)
      const data = (res as any).data ?? res as unknown as CaseDetail
      setCaseData(data)
      setFormData({
        category: data.category || '',
        agency: data.responsible || '',
        problem: data.problem || '',
        solution: data.solution_method || '',
        reportDate: data.created_at ? dayjs(data.created_at).format('DD MMM BBBB') : '',
        inspectDate: data.inspection_date ? dayjs(data.inspection_date).format('DD MMM BBBB') : '',
        beforeImages: 0,
        afterImages: 0,
      })
    } catch (err) {
      console.error('Error fetching case:', err)
      setError('ไม่สามารถโหลดข้อมูล Case ได้')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCase()
  }, [fetchCase])

  const handleSave = async () => {
    if (saving) return
    try {
      setSaving(true)
      await updateMaintenanceCaseAPI(id, {
        category: formData.category || undefined,
        problem: formData.problem || undefined,
        responsible: formData.agency || undefined,
        solution_method: formData.solution || undefined,
        inspection_date: formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th').format('YYYY-MM-DD') : null,
        is_closed: hasData ? closeCaseAfterSave : undefined,
      })
      await fetchCase()
      setModalOpen(true)
    } catch (err) {
      console.error('Error saving case:', err)
      modal.error({
        title: 'บันทึกไม่สำเร็จ',
        content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        okText: 'ตกลง',
        centered: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const hasData = Boolean(caseData?.inspection_date)

  const handleDeleteBeforeImage = (_index: number) => {
    setFormData(prev => ({ ...prev, beforeImages: prev.beforeImages - 1 }))
  }

  const handleDeleteAfterImage = (_index: number) => {
    setFormData(prev => ({ ...prev, afterImages: prev.afterImages - 1 }))
  }

  // Determine repair status from API data
  const repairStatus: RepairStatus = caseData?.closed_at
    ? 'completed'
    : hasData
      ? 'in_progress'
      : 'pending'

  const statusConfig = REPAIR_STATUS_CONFIG[repairStatus]

  // Placeholder project/device info (API doesn't return these yet)
  const project: ProjectInfo = {
    projectName: '-',
    contractor: '-',
    agency: formData.agency || '-',
    contractNo: '-',
    warrantyStart: '-',
    warrantyEnd: '-',
    warrantyStatus: 'expired',
  }

  const device: DeviceInfo = {
    deviceName: caseData?.camera_id || '-',
    deviceType: '-',
    installPoint: '-',
    ipAddress: '-',
    offlineDate: '-',
    offlineDays: 0,
    hasLive: false,
  }

  if (loading) {
    return (
      <div className='main-screen flex items-center justify-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className='main-screen flex items-center justify-center h-64 text-[#E94C4C]'>
        {error || 'ไม่พบข้อมูล Case'}
      </div>
    )
  }

  return (
    <div className='main-screen'>
      <style>{`
        .maintenance-upload-dragger .ant-upload {
          padding: 8px !important;
        }
        .maintenance-upload-dragger .ant-upload-drag {
          min-height: unset !important;
        }
      `}</style>
      <TitleSection caseId={id} />

      {/* ─── Status Badges ─── */}
      <section className='mt-5 px-4 md:px-10 flex flex-col sm:flex-row gap-3 sm:gap-4'>
        <div
          className='flex flex-col justify-center gap-1 px-5 sm:px-6 w-full sm:w-75'
          style={{
            height: 110,
            borderRadius: 20,
            background: statusConfig.bg,
            border: `2px solid ${statusConfig.color}`,
          }}
        >
          <p style={{ color: statusConfig.color, fontWeight: 400, fontSize: 14, margin: 0 }}>
            สถานะซ่อมแซม
          </p>
          <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {statusConfig.label}
          </p>
        </div>
        <div
          className='flex flex-col justify-center gap-1 px-5 sm:px-6 w-full sm:w-75'
          style={{
            height: 110,
            borderRadius: 20,
            background: '#FFFFFF1A',
            border: '2px solid #FFFFFF',
          }}
        >
          <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: 0, opacity: 0.6 }}>
            หมวดปัญหา
          </p>
          <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>
            {formData.category || 'ยังไม่ระบุ'}
          </p>
        </div>
      </section>

      {/* ─── Main Content (Form + Sidebar) ─── */}
      <section className='mt-4 px-4 md:px-10 flex flex-col lg:flex-row gap-4'>
        {/* Left: Form area */}
        <div
          className='w-full lg:flex-[0_0_calc(70%-8px)] flex flex-col gap-4 p-4 md:p-6'
          style={{ minHeight: 200, borderRadius: 20, background: '#333333' }}
        >
          {/* Form + Upload row */}
          <div className='flex flex-col md:flex-row gap-4 flex-1'>
            {/* Form section */}
            <div
              className='w-full md:flex-[0_0_calc(70%-8px)] rounded-2xl p-4 md:p-5'
              style={{ background: '#191919' }}
            >
              <div className='flex items-start gap-2 pt-2'>
                <img src='/atlas/images/Maintenance/iccf.png' alt='' width={30} height={30} />
                <div>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: 0 }}>บันทึกแจ้งซ่อม</p>
                  <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: 0, marginTop: -4 }}>เพิ่มรายละเอียดปัญหาหรือสาเหตุที่พบ แนบรูปภาพหรือวิดีโอ</p>
                </div>
              </div>
              <p className='pl-0 md:pl-9.5 mt-4' style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16 }}>ข้อมูลการแจ้งซ่อม</p>

              {/* Selects row */}
              <div className='pl-0 md:pl-9.5 mt-3 flex flex-col sm:flex-row gap-4'>
                <div className='flex-1 w-full'>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
                  <Select
                    placeholder='กรุณาเลือกหมวดหมู่...'
                    style={{ width: '100%', height: 40, borderRadius: 10 }}
                    suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                    value={formData.category || undefined}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    options={[
                      { label: 'CCTV', value: 'cctv' },
                      { label: 'Traffic Volume', value: 'traffic_volume' },
                      { label: 'Incident Detection', value: 'incident_detection' },
                      { label: 'Traffic Signal', value: 'traffic_signal' },
                      { label: 'Traffic Lighting', value: 'traffic_lighting' },
                      { label: 'VMS', value: 'vms' },
                    ]}
                  />
                </div>
                <div className='flex-1 w-full'>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบหรือมอบหมาย<span style={{ color: '#E94C4C' }}>*</span></p>
                  <Select
                    placeholder='กรุณาเลือกหน่วยงาน...'
                    style={{ width: '100%', height: 40, borderRadius: 10 }}
                    suffixIcon={<TbChevronDown style={{ color: '#FCD116', fontSize: 16 }} />}
                    value={formData.agency || undefined}
                    onChange={(value) => setFormData(prev => ({ ...prev, agency: value }))}
                    options={[
                      { label: 'หมวดบำรุงทางหลวงชนบทกัลปพฤกษ์', value: 'agency_1' },
                      { label: 'สทช. 1 (ปทุมธานี)', value: 'agency_2' },
                      { label: 'สทช. 2 (นนทบุรี)', value: 'agency_3' },
                      { label: 'สทช. 3 (สมุทรปราการ)', value: 'agency_4' },
                    ]}
                  />
                </div>
              </div>

              {/* Problem textarea */}
              <div className='pl-0 md:pl-9.5 mt-3'>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
                <Input.TextArea
                  placeholder='กรุณาระบุปัญหาที่พบ...'
                  style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  value={formData.problem}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                />
              </div>

              {/* Solution textarea */}
              <div className='pl-0 md:pl-9.5 mt-3'>
                <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข<span style={{ color: '#E94C4C' }}>*</span></p>
                <Input.TextArea
                  placeholder='กรุณาระบุวิธีการแก้ไข...'
                  style={{ background: 'transparent', border: '1px solid #FCD116', borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  value={formData.solution}
                  onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                />
              </div>

              {/* Duration */}
              <p className='pl-0 md:pl-9.5' style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0, marginTop: 16 }}>ระยะเวลา</p>
              <ConfigProvider locale={thTH}>
                <div className='pl-0 md:pl-9.5 mt-3 flex flex-col sm:flex-row gap-4'>
                  <div className='flex-1 w-full'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
                    <DatePicker
                      placeholder='กรุณาเลือกวันที่...'
                      format='DD MMM BBBB'
                      style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                      suffixIcon={<img src='/atlas/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                      value={formData.reportDate ? dayjs(formData.reportDate, 'DD MMM BBBB', 'th') : null}
                      onChange={(date) => setFormData(prev => ({ ...prev, reportDate: date ? date.format('DD MMM BBBB') : '' }))}
                    />
                  </div>
                  <div className='flex-1 w-full'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ<span style={{ color: '#E94C4C' }}>*</span></p>
                    <DatePicker
                      placeholder='กรุณาเลือกวันที่...'
                      format='DD MMM BBBB'
                      style={{ width: '100%', height: 40, background: 'transparent', border: '1px solid #FCD116', borderRadius: 10 }}
                      suffixIcon={<img src='/atlas/images/Maintenance/icdate.png' alt='' width={24} height={24} />}
                      value={formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th') : null}
                      onChange={(date) => setFormData(prev => ({ ...prev, inspectDate: date ? date.format('DD MMM BBBB') : '' }))}
                    />
                  </div>
                </div>
              </ConfigProvider>
            </div>

            {/* Upload section */}
            <div
              className='w-full md:flex-[0_0_calc(30%-8px)] rounded-2xl p-4 md:p-5 flex flex-col'
              style={{ background: '#191919' }}
            >
              <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: 0 }}>รูปภาพหรือวิดิโอ</p>
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '12px 0 4px 0' }}>ก่อนซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
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
              {formData.beforeImages > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {Array.from({ length: formData.beforeImages }).map((_, index) => (
                    <div
                      key={index}
                      className={styles.imagePreviewItem}
                      style={{ background: '#2A2A2A' }}
                    >
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src='/atlas/images/Maintenance/iccf.png' alt='' width={32} height={32} style={{ opacity: 0.5 }} />
                      </div>
                      <div
                        className={styles.imagePreviewOverlay}
                        onClick={() => handleDeleteBeforeImage(index)}
                      >
                        <TbTrash size={24} color='#FFFFFF' />
                      </div>
                    </div>
                  ))}
                  {/* PDF mock */}
                  <div className={styles.imagePreviewItem} style={{ background: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <TbFileText size={24} color='#000000' />
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
                    <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
                  </div>
                </div>
              )}
              <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '12px 0 4px 0' }}>หลังซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
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
              {formData.afterImages > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {Array.from({ length: formData.afterImages }).map((_, index) => (
                    <div
                      key={index}
                      className={styles.imagePreviewItem}
                      style={{ background: '#2A2A2A' }}
                    >
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src='/atlas/images/Maintenance/iccf.png' alt='' width={32} height={32} style={{ opacity: 0.5 }} />
                      </div>
                      <div
                        className={styles.imagePreviewOverlay}
                        onClick={() => handleDeleteAfterImage(index)}
                      >
                        <TbTrash size={24} color='#FFFFFF' />
                      </div>
                    </div>
                  ))}
                  {/* PDF mock */}
                  <div className={styles.imagePreviewItem} style={{ background: '#FCD116', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <TbFileText size={24} color='#000000' />
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>เอกสาร PDF</span>
                    <span style={{ fontSize: 8, color: '#000000' }}>5.9 MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className='flex flex-wrap items-center gap-3 mt-auto'>
            {hasData && (
              <div
                onClick={() => setCloseCaseAfterSave(prev => !prev)}
                className='flex items-center gap-2.5 cursor-pointer px-4 py-1.5 rounded-full transition-all duration-200'
                style={{
                  border: `1px solid ${closeCaseAfterSave ? '#05F2DB' : '#555'}`,
                  background: closeCaseAfterSave ? 'rgba(5, 242, 219, 0.1)' : 'transparent',
                }}
              >
                <div
                  className='relative shrink-0 transition-all duration-200'
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: closeCaseAfterSave ? '#05F2DB' : '#3C3C3C',
                  }}
                >
                  <div
                    className='absolute top-px transition-all duration-200'
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      left: closeCaseAfterSave ? 18 : 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
                <span className='whitespace-nowrap text-[13px] font-medium' style={{ color: closeCaseAfterSave ? '#05F2DB' : '#999' }}>
                  ปิด Case หลังบันทึก
                </span>
              </div>
            )}
            <div className='ml-auto flex flex-wrap items-center gap-3'>
              <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
                <Button type="primary" size="small" shape="round" icon={<TbPrinter />} style={{ height: 31 }}>
                  นำออกเอกสาร
                </Button>
              </ConfigProvider>
              <button className={styles.btnSecondary} style={{ background: '#C4C4C4', color: '#000000' }}>
                ยกเลิก
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...(hasData ? { background: '#05F2DB', color: '#000000' } : {}),
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'กำลังบันทึก...' : hasData ? 'บันทึก + ปิด Case' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className='w-full lg:flex-[0_0_calc(30%-8px)] flex flex-col gap-4'>
          {/* Project info */}
          <div
            className='rounded-[20px] p-4 md:p-6'
            style={{ background: '#191919' }}
          >
            <div className='flex items-center gap-2'>
              <img src='/atlas/images/Maintenance/icf1.png' alt='' width={30} height={30} />
              <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลโครงการ</p>
            </div>
            <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{project.projectName}</p>
            <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4'>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>ผู้รับจ้าง</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{project.contractor}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>หน่วยงานรับผิดชอบ</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{project.agency}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>เลขที่สัญญา</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{project.contractNo}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>เริ่มต้นการรับประกัน</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{project.warrantyStart}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>สิ้นสุดการรับประกัน</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{project.warrantyEnd}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>สถานะค้ำประกัน</p>
                <p style={{ color: project.warrantyStatus === 'expired' ? '#E94C4C' : '#66AEFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>
                  {project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
                </p>
              </div>
            </div>
          </div>

          {/* Device info */}
          <div
            className='rounded-[20px] p-4 md:p-6'
            style={{ background: '#191919' }}
          >
            <div className='flex items-center gap-2'>
              <img src='/atlas/images/Maintenance/icf1.png' alt='' width={30} height={30} />
              <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
            </div>
            <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '12px 0 0 0' }}>{device.deviceName}</p>
            <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4'>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc2.1.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>ประเภทอุปกรณ์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{device.deviceType}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc2.2.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>จุดติดตั้ง / สายทาง</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{device.installPoint}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc3.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>IP Address</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{device.ipAddress}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc4-5.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>วันที่เริ่มออฟไลน์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{device.offlineDate || '-'}</p>
              </div>
              <div className='flex flex-col items-center'>
                <img src='/atlas/images/Maintenance/icsc6.png' alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>จำนวนวันออฟไลน์</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{device.offlineDays > 0 ? `${device.offlineDays} วัน` : '-'}</p>
              </div>
              {device.hasLive && (
                <div className='flex flex-col items-center'>
                  <div style={{ width: 90, height: 69, borderRadius: 10, background: '#66AEFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <img src='/atlas/images/Maintenance/iclive.png' alt='' width={30} height={30} />
                    <p style={{ color: '#000000', fontWeight: 400, fontSize: 14, margin: 0 }}>Live</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ModalSaveSuccess
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isClosingCase={hasData}
        data={{
          caseNo: id,
          deviceName: device.deviceName,
          agency: project.agency,
          warrantyStatus: project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ',
          repairDate: formData.reportDate || '-',
        }}
      />
    </div>
  )
}

const MaintenanceCaseScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      <CaseContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(MaintenanceCaseScreen)
