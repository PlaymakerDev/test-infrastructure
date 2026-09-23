"use client"
import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { App, ConfigProvider, DatePicker, Input, Modal, Spin, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { AxiosError } from 'axios'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import { TbFileText, TbPrinter, TbTool, TbTrash } from 'react-icons/tb'
import styles from '../screen/maintenance-case.module.css'
import ModalSaveSuccess from './ModalSaveSuccess'
import TitleSection from './TitleSection'
import ProjectInfoCard from './ProjectInfoCard'
import CaseDeviceTable from './CaseDeviceTable'
import { deviceSummary, type CaseDeviceRow, type CaseProjectInfo } from './caseViewTypes'
import type { CaseDetail } from '@/types/maintenance'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateMaintenanceCase, useUploadMaintenance } from '@/hooks/queries/maintenance'
import { maintenanceKeys } from '@/hooks/queries/maintenance/queryKeys'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { parseImageUrls } from '../../data/parseImageUrls'
import { contractorProblem } from '../../data/contractorProblem'
import { compressImage } from '../../data/compressImage'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime', 'application/pdf']
const MAX_UPLOAD_SIZE = 200 * 1024 * 1024
/** ≤4 attachments per box (2026-09-11 redesign). */
const MAX_FILES = 4

const urlToUploadFile = (url: string, index: number): UploadFile => ({
  uid: `existing-${index}`,
  name: url.split('/').pop() || `file-${index}`,
  status: 'done',
  url,
  thumbUrl: url,
  type: /\.(jpe?g|png|gif)$/i.test(url) ? 'image/*' : undefined,
})

export interface ContractorCaseViewProps {
  caseId: string
  caseData: CaseDetail
  project: CaseProjectInfo
  devices: CaseDeviceRow[]
  solutionId?: number
  detailQuery: string
  returnToAllRepairs: boolean
  returnToRepairHistory?: boolean
  /** หนังสือแจ้งซ่อม (orange) — direct letter-PDF download. */
  onExportLetter: () => void | Promise<void>
}

/** มุมมองผู้รับจ้าง (mock 7/8/9, 2026-09-11 redesign): บันทึกแจ้งซ่อม form +
 *  ก่อน/หลังซ่อม uploads + ข้อมูลโครงการ card with the ข้อมูลอุปกรณ์ modal.
 *
 *  Two save shapes (user 2026-09-17):
 *  - "บันทึก" (yellow) whenever the case can't close yet — either a device is
 *    still offline or the repair record isn't complete. Saves progress.
 *  - "บันทึก + ปิด Case" (teal) only when EVERY device is back online AND the
 *    record is complete; that click closes the case.
 *  So a contractor can file the report while devices are still down, then come
 *  back through the Case No. link once they're online and close it. */
const ContractorCaseView: React.FC<ContractorCaseViewProps> = ({
  caseId,
  caseData,
  project,
  devices,
  solutionId,
  detailQuery,
  returnToAllRepairs,
  returnToRepairHistory,
  onExportLetter,
}) => {
  const { modal, message } = App.useApp()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)

  // `problemFound` (ปัญหาที่พบ) is the contractor's own field — deliberately
  // not named `problem`, which is the officer's เหตุผลการแจ้งซ่อม on the letter.
  const [formData, setFormData] = useState({ problemFound: '', solution: '', inspectDate: '' })
  const [beforeFiles, setBeforeFiles] = useState<UploadFile[]>([])
  const [afterFiles, setAfterFiles] = useState<UploadFile[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const clearFieldError = (key: string) =>
    setFieldErrors(prev => (prev[key] ? { ...prev, [key]: false } : prev))

  // Seed the editable state from the case payload — adjust-during-render per
  // the React pattern. Keyed on the record's CONTENT (case + updated_at), not
  // object identity: a background refetch hands back an equal-but-new object,
  // and re-seeding on that wiped local edits (deleted photos came back).
  const seedKey = `${caseData.case_no}|${caseData.updated_at}`
  const [seededFrom, setSeededFrom] = useState<string | null>(null)
  if (seedKey !== seededFrom) {
    setSeededFrom(seedKey)
    setFormData({
      problemFound: contractorProblem(caseData),
      solution: caseData.solution_method || '',
      inspectDate: caseData.inspection_date ? dayjs(caseData.inspection_date).format('DD MMM BBBB') : '',
    })
    setBeforeFiles(parseImageUrls(caseData.before_image).map(urlToUploadFile))
    setAfterFiles(parseImageUrls(caseData.after_image).map(urlToUploadFile))
  }

  const { mutateAsync: uploadMaintenance } = useUploadMaintenance()

  const uploadFile = useCallback(async (file: UploadFile, kind: 'before' | 'after') => {
    const setFiles = kind === 'before' ? setBeforeFiles : setAfterFiles
    setFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'uploading' } : f)))
    try {
      const fd = new FormData()
      // Images are downscaled client-side before upload (≤4 previews per box
      // must stay fast to load); video/PDF pass through untouched.
      fd.append('upload', await compressImage(file.originFileObj as File))
      const response = await uploadMaintenance(fd)
      const path = response.data?.path?.trim()
      if (!path) throw new Error('อัปโหลดไม่สำเร็จ: ระบบไม่ส่งที่อยู่ไฟล์กลับมา')
      setFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'done', url: path, thumbUrl: path } : f)))
    } catch (err) {
      setFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'error' } : f)))
      message.error(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? 'อัปโหลดไม่สำเร็จ')
          : err instanceof Error
            ? err.message
            : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
      )
    }
  }, [message, uploadMaintenance])

  const updateCase = useUpdateMaintenanceCase(caseId)
  const saving = updateCase.isPending
  const uploading = [...beforeFiles, ...afterFiles].some(f => f.status === 'uploading')

  // ปิด Case ได้ต่อเมื่อครบสองอย่าง (user 2026-09-17):
  //   1. อุปกรณ์ที่เปิด case มาออนไลน์ครบทุกตัว (สถานะเดียวกับ modal ข้อมูลอุปกรณ์)
  //   2. กรอกเอกสารบันทึกแจ้งซ่อมครบทุกช่อง* + แนบรูปก่อน/หลังซ่อม
  // ยังไม่ครบข้อไหนก็ตาม = ปุ่ม "บันทึก" เหลืองตามเดิม (บันทึกความคืบหน้าได้
  // เรื่อย ๆ) แล้วกลับเข้ามาปิดทีหลังเมื่ออุปกรณ์กลับมาออนไลน์.
  const allOnline = devices.length > 0 && devices.every(d => d.isOnline)
  const hasUploaded = (files: UploadFile[]) => files.some(f => f.status === 'done' && f.url)
  const formComplete = Boolean(
    formData.problemFound.trim() &&
    formData.solution.trim() &&
    formData.inspectDate &&
    hasUploaded(beforeFiles) &&
    hasUploaded(afterFiles),
  )
  const canClose = allOnline && formComplete

  const handleSave = () => {
    if (saving || uploading) return
    const missing: [string, string][] = []
    if (!formData.problemFound.trim()) missing.push(['problemFound', 'ปัญหาที่พบ'])
    if (canClose) {
      // Safety net — the teal button only shows once these already pass.
      if (!formData.solution.trim()) missing.push(['solution', 'การดำเนินการหรือวิธีการแก้ไข'])
      if (!formData.inspectDate) missing.push(['inspectDate', 'วันที่ตรวจสอบ'])
      if (!hasUploaded(beforeFiles)) missing.push(['before', 'รูปก่อนซ่อม'])
      if (!hasUploaded(afterFiles)) missing.push(['after', 'รูปหลังซ่อม'])
    }
    if (missing.length > 0) {
      // Short toast + red outlines, same as the letter form.
      setFieldErrors(Object.fromEntries(missing.map(([k]) => [k, true])))
      message.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    setFieldErrors({})
    updateCase.mutate({
      // category/responsible/problem belong to the officer's letter — echo the
      // server's values back, because this PUT blanks any plain-string field
      // it doesn't receive (verified 2026-09-21).
      category: caseData.category || undefined,
      responsible: caseData.responsible || undefined,
      problem: caseData.problem || undefined,
      // ปัญหาที่พบ — the contractor's own column since 2026-09-21. Writing it
      // used to land in `problem` and overwrite the officer's reason.
      problem_found: formData.problemFound,
      solution_method: formData.solution || undefined,
      inspection_date: formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th').format('YYYY-MM-DD') : null,
      before_image: beforeFiles.filter(f => f.status === 'done' && f.url).map(f => f.url as string),
      after_image: afterFiles.filter(f => f.status === 'done' && f.url).map(f => f.url as string),
      is_closed: canClose ? true : undefined,
      // Saving without closing moves the case off "ยังไม่ดำเนินการ" — the
      // backend keeps it `open` otherwise, so the officer's tracking pill and
      // the all-repairs tabs would never show work in progress.
      status: canClose ? undefined : 'in_progress',
    }, {
      onSuccess: () => {
        setModalOpen(true)
      },
      onError: (err) => {
        console.error('Error saving case:', err)
        modal.error({ title: 'บันทึกไม่สำเร็จ', content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', okText: 'ตกลง', centered: true })
      },
    })
  }

  const makeDraggerProps = (kind: 'before' | 'after') => {
    const files = kind === 'before' ? beforeFiles : afterFiles
    const setFiles = kind === 'before' ? setBeforeFiles : setAfterFiles
    return {
      style: {
        background: 'transparent',
        border: `1px dashed ${fieldErrors[kind] ? '#E94C4C' : '#FCD116'}`,
        borderRadius: 10,
        height: 120,
        textAlign: 'center' as const,
      },
      className: 'maintenance-upload-dragger',
      accept: '.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.pdf',
      showUploadList: false,
      multiple: true,
      // CONTROLLED list. Without it AntD keeps its own copy: deleting a preview
      // only cleared our state, so the next pick handed the removed file back
      // as "new" and it reappeared (user 2026-09-21).
      fileList: files,
      beforeUpload: (file: File) => {
        if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
          message.error('ประเภทไฟล์ไม่ถูกต้อง')
          return Upload.LIST_IGNORE
        }
        if (file.size > MAX_UPLOAD_SIZE) {
          message.error('ไม่สามารถอัปโหลดไฟล์ได้ ไฟล์ที่อัปโหลดมีขนาดเกิน 200 MB')
          return Upload.LIST_IGNORE
        }
        return false
      },
      onChange: ({ fileList }: { fileList: UploadFile[] }) => {
        clearFieldError(kind)
        const added = fileList.filter(f => !files.some(existing => existing.uid === f.uid))
        const slots = MAX_FILES - files.length
        if (added.length > slots) {
          message.warning(`แนบได้ไม่เกิน ${MAX_FILES} ไฟล์`)
        }
        const accepted = added.slice(0, Math.max(0, slots))
        if (accepted.length === 0) return
        setFiles(prev => [...prev, ...accepted])
        accepted.forEach(f => uploadFile(f, kind))
      },
    }
  }

  const renderPreviews = (files: UploadFile[], onDelete: (uid: string) => void) =>
    files.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {files.map((file) => {
          const isImage = file.type?.startsWith('image/')
          return (
            <div key={file.uid} className={styles.imagePreviewItem} style={{ background: '#2A2A2A' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.status === 'uploading' ? (
                  <Spin size='small' />
                ) : isImage && file.thumbUrl ? (
                  <img src={file.thumbUrl} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <TbFileText size={32} color={file.status === 'error' ? '#E94C4C' : '#FCD116'} />
                )}
              </div>
              <div className={styles.imagePreviewOverlay} onClick={() => onDelete(file.uid)}>
                <TbTrash size={24} color='#FFFFFF' />
              </div>
            </div>
          )
        })}
      </div>
    )

  const firstDevice = devices[0]
  // The letter's own ลงวันที่แจ้งซ่อม, falling back to when the case was opened.
  const reportDateText = dayjs(caseData.document_date || caseData.created_at).format('DD MMM BBBB')

  const labelStyle: React.CSSProperties = { color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }

  return (
    <>
      <TitleSection
        caseId={caseId}
        solutionId={solutionId}
        detailQuery={detailQuery}
        returnToAllRepairs={returnToAllRepairs}
        returnToRepairHistory={returnToRepairHistory}
        subtitle={deviceSummary(devices)}
        warranty={project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
        isOnline={allOnline}
        rightContent={
          <>
            <button
              type='button'
              className={styles.btnSecondary}
              style={{ background: '#FF8A00', color: '#212121', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={onExportLetter}
            >
              <TbPrinter size={16} />
              หนังสือแจ้งซ่อม
            </button>
            <button
              type='button'
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                ...(canClose ? { background: '#05F2DB', color: '#000000' } : {}),
                opacity: saving || uploading ? 0.6 : 1,
                cursor: saving || uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? 'กำลังอัปโหลด...' : saving ? 'กำลังบันทึก...' : canClose ? 'บันทึก + ปิด Case' : 'บันทึก'}
            </button>
          </>
        }
      />

      <section className='mt-4 px-4 md:px-10 flex flex-col xl:flex-row gap-4 items-start'>
        {/* Left: form + uploads */}
        <div
          className='w-full xl:flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6'
          style={{ borderRadius: 20, background: '#333333' }}
        >
          {/* บันทึกแจ้งซ่อม */}
          {/* 66/34 per the Figma: the write-up needs the room, the two
            * dropzones read fine narrower (user 2026-09-21). */}
          <div className='w-full md:flex-[0_0_calc(66%-8px)] rounded-2xl p-4 md:p-5' style={{ background: '#191919' }}>
            <div className='flex items-start gap-2 pt-2'>
              <img src={`${BASE_PATH}/images/Maintenance/iccf.png`} alt='' width={30} height={30} />
              <div>
                <p style={{ color: '#FCD116', fontSize: 16, margin: 0 }}>บันทึกแจ้งซ่อม</p>
                <p style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: 0, marginTop: -4 }}>
                  เพิ่มรายละเอียดปัญหาหรือสาเหตุที่พบ แนบรูปภาพหรือวิดีโอ
                </p>
              </div>
            </div>
            <p className='mt-4' style={{ color: '#FFFFFF', fontSize: 16, margin: 0, marginTop: 16 }}>ข้อมูลการแจ้งซ่อม</p>

            <div className='mt-3'>
              <p style={labelStyle}>ปัญหาที่พบ<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input.TextArea
                placeholder='กรุณาระบุปัญหาที่พบ...'
                style={{ background: 'transparent', border: `1px solid ${fieldErrors.problemFound ? '#E94C4C' : '#FCD116'}`, borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                autoSize={{ minRows: 4, maxRows: 7 }}
                value={formData.problemFound}
                onChange={(e) => { clearFieldError('problemFound'); setFormData(prev => ({ ...prev, problemFound: e.target.value })) }}
              />
            </div>

            <div className='mt-3'>
              <p style={labelStyle}>การดำเนินการหรือวิธีการแก้ไข<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input.TextArea
                placeholder='กรุณาระบุวิธีการแก้ไข...'
                style={{ background: 'transparent', border: `1px solid ${fieldErrors.solution ? '#E94C4C' : '#FCD116'}`, borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
                autoSize={{ minRows: 4, maxRows: 7 }}
                value={formData.solution}
                onChange={(e) => { clearFieldError('solution'); setFormData(prev => ({ ...prev, solution: e.target.value })) }}
              />
            </div>

            <p style={{ color: '#FFFFFF', fontSize: 16, margin: 0, marginTop: 16 }}>ระยะเวลา</p>
            <ConfigProvider locale={thTH}>
              <div className='mt-3 flex flex-col sm:flex-row gap-4'>
                <div className='flex-1 w-full'>
                  <p style={labelStyle}>วันที่แจ้งซ่อม (เปิด case)</p>
                  {/* Read-only per the redesign — this IS the case-open date. */}
                  <div
                    className='flex items-center px-3'
                    style={{ height: 40, borderRadius: 10, background: '#2A2A2A', color: '#C9C9C9', fontSize: 'var(--fs-12)' }}
                  >
                    {reportDateText}
                  </div>
                </div>
                <div className='flex-1 w-full'>
                  <p style={labelStyle}>วันที่ตรวจสอบ<span style={{ color: '#E94C4C' }}>*</span></p>
                  <DatePicker
                    placeholder='กรุณาเลือกวันที่...'
                    format='DD MMM BBBB'
                    style={{ width: '100%', height: 40, background: 'transparent', border: `1px solid ${fieldErrors.inspectDate ? '#E94C4C' : '#FCD116'}`, borderRadius: 10 }}
                    suffixIcon={<img src={`${BASE_PATH}/images/Maintenance/icdate.png`} alt='' width={24} height={24} />}
                    value={formData.inspectDate ? dayjs(formData.inspectDate, 'DD MMM BBBB', 'th') : null}
                    onChange={(date) => { clearFieldError('inspectDate'); setFormData(prev => ({ ...prev, inspectDate: date ? date.format('DD MMM BBBB') : '' })) }}
                  />
                </div>
              </div>
            </ConfigProvider>
          </div>

          {/* รูปภาพหรือวิดิโอ */}
          <div className='w-full md:flex-[0_0_calc(34%-8px)] rounded-2xl p-4 md:p-5 flex flex-col' style={{ background: '#191919' }}>
            <p style={{ color: '#FFFFFF', fontSize: 16, margin: 0 }}>รูปภาพหรือวิดิโอ</p>
            <p style={{ color: '#FCD116', fontSize: 16, margin: '12px 0 4px 0' }}>ก่อนซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
            <p style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: '0 0 8px 0' }}>ลากและวางที่นี่เพื่อดำเนินการต่อ (สูงสุด {MAX_FILES} ไฟล์)</p>
            <Upload.Dragger {...makeDraggerProps('before')}>
              <img src={`${BASE_PATH}/images/Maintenance/cloud-upload.png`} alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์วิดีโอ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF หรือไฟล์ PDF</p>
            </Upload.Dragger>
            {renderPreviews(beforeFiles, (uid) => setBeforeFiles(prev => prev.filter(f => f.uid !== uid)))}

            <p style={{ color: '#FCD116', fontSize: 16, margin: '12px 0 4px 0' }}>หลังซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
            <p style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: '0 0 8px 0' }}>ลากและวางที่นี่เพื่อดำเนินการต่อ (สูงสุด {MAX_FILES} ไฟล์)</p>
            <Upload.Dragger {...makeDraggerProps('after')}>
              <img src={`${BASE_PATH}/images/Maintenance/cloud-upload.png`} alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์วิดีโอ MP4, AVI, MOV หรือไฟล์ JPG, PNG, GIF หรือไฟล์ PDF</p>
            </Upload.Dragger>
            {renderPreviews(afterFiles, (uid) => setAfterFiles(prev => prev.filter(f => f.uid !== uid)))}
          </div>
        </div>

        {/* Right: project card + device modal trigger */}
        <div className='w-full xl:w-[420px] shrink-0'>
          <ProjectInfoCard
            project={project}
            headerExtra={
              <button
                type='button'
                className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full fs-12 cursor-pointer hover:opacity-85'
                style={{ background: '#66AEFF', color: '#0A0A0A', border: 'none' }}
                onClick={() => {
                  // "สถานะปัจจุบัน" must be current: the contractor opens this
                  // to check whether the devices came back online, which is
                  // what unlocks the teal ปิด Case button.
                  void queryClient.invalidateQueries({ queryKey: maintenanceKeys.case(caseId) })
                  setDeviceModalOpen(true)
                }}
              >
                <TbTool size={14} />
                ข้อมูลอุปกรณ์
              </button>
            }
          />
        </div>
      </section>

      {/* ข้อมูลอุปกรณ์ modal (mock 9) — status + Live per device */}
      <ConfigProvider
        theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', borderRadiusLG: 16 } } }}
      >
        <Modal
          open={deviceModalOpen}
          onCancel={() => setDeviceModalOpen(false)}
          footer={null}
          width={1200}
          centered
          destroyOnHidden
          title={
            <span className='inline-flex items-center gap-2' style={{ color: '#66AEFF', fontSize: 18 }}>
              <TbTool size={20} />
              ข้อมูลอุปกรณ์
              <span
                className='inline-flex items-center gap-1 px-3 py-0.5 rounded-full ml-2'
                style={{ border: '1px solid #E94C4C', color: '#E94C4C', fontSize: 12 }}
              >
                <TbTool size={12} />
                {devices.length}
              </span>
            </span>
          }
        >
          <CaseDeviceTable
            rows={devices}
            showStatusLive
            onLive={(cameraId) => dispatch(setCCTVModalOpen({ open: true, camera_id: cameraId }))}
          />
        </Modal>
      </ConfigProvider>

      <ModalSaveSuccess
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isClosingCase={canClose}
        solutionId={solutionId}
        detailQuery={detailQuery}
        returnToAllRepairs={returnToAllRepairs}
        data={{
          caseNo: caseId,
          deviceName: deviceSummary(devices),
          agency: project.agency,
          warrantyStatus: project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ',
          repairDate: reportDateText,
          dueDate: caseData.due_date ? dayjs(caseData.due_date).format('DD MMM BBBB') : undefined,
          // The case closes with THIS save, so the close date is today.
          closedDate: canClose ? dayjs().format('DD MMM BBBB') : undefined,
        }}
        // Closing sends the contractor to ประวัติการซ่อม, where the row they
        // just finished is highlighted for a few minutes.
        onConfirm={canClose && solutionId ? () => {
          const query = detailQuery ? `?${detailQuery}` : ''
          router.push(`/admin/maintenance/detail/${solutionId}/repair-history${query}`)
        } : undefined}
      />
    </>
  )
}

export default React.memo<ContractorCaseViewProps>(ContractorCaseView)
