"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { App, ConfigProvider, DatePicker, Input, Spin, Upload } from 'antd'
import type { InputRef, UploadFile } from 'antd'
import { AxiosError } from 'axios'
import thTH from 'antd/locale/th_TH'
import dayjs from 'dayjs'
import { TbFileText, TbTool, TbTrash } from 'react-icons/tb'
import styles from '../screen/maintenance-case.module.css'
import TitleSection from './TitleSection'
import ProjectInfoCard from './ProjectInfoCard'
import CaseDeviceTable from './CaseDeviceTable'
import LetterPreviewModal, { previewActionButton } from './LetterPreviewModal'
import ConfirmCreateLetterModal from './ConfirmCreateLetterModal'
import SignedLetterReminderModal from './SignedLetterReminderModal'
import type { CaseDeviceRow, CaseProjectInfo } from './caseViewTypes'
import type { RepairLetterInput } from '../data/repairLetter'
import { useCreateMaintenanceCase, useMaintenanceSolution, useProjectBySolution, useUploadMaintenance } from '@/hooks/queries/maintenance'
import { getMaintenanceCasesAPI } from '@/services/routes/MaintenanceService'
import { useProjectContractors } from '@/hooks/queries/manage'
import { isRealTimestamp, offlineDaysSince } from '../../data/offlineDays'
import { compressImage } from '../../data/compressImage'
import { deviceTypeText, deviceTypeThaiText } from '../../data/deviceTypes'
import { caretAfterFormat, formatBudgetInput, significantBefore } from '../../data/budgetInput'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Letter photos are JPG/JPEG/PNG only per the mock. */
const LETTER_UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

/** "5,000,000" / "5000000.50" → number for `project_budget`; blank → null. */
const parseBudget = (value: string): number | null => {
  const n = Number(value.replace(/[, ]/g, ''))
  return value.trim() && Number.isFinite(n) ? n : null
}
const MAX_UPLOAD_SIZE = 200 * 1024 * 1024
const MAX_FILES = 4

export interface CaseCreateViewProps {
  /** From the OpenCaseModal selection (`camera_ids` query param). */
  cameraIds: string[]
  solutionId?: number
  detailQuery: string
}

interface LetterForm {
  letterNo: string
  budget: string
  reason: string
  assignee: string
  position: string
  contact: string
  contractClause: string
  reportDate: string
  dueDate: string
}

/** หน้าออกหนังสือแจ้งซ่อม / สร้างเคสใหม่ (mock 3, 2026-09-11 redesign).
 *  Reached from the OpenCaseModal — NO case exists yet: the case (and its
 *  auto-issued Case No.) is created when the officer saves this letter.
 *
 *  `POST /manage/maintenance/case` takes `camera_ids[]` since the 2026-09-16
 *  backend release, so one case covers every selected device.
 *
 *  Every letter field has a column since the 2026-09-18 release, so the whole
 *  form round-trips. ⚠ PENDING BE: the create response still carries no
 *  `case_no`, so the new number is read back from the solution's case list
 *  (newest wins — see `resolveNewCaseNo`).
 *
 *  Saving takes three steps (user 2026-09-28): บันทึกแบบฟอร์มหนังสือแจ้งซ่อม →
 *  preview the PDF (แก้ไข / บันทึก) → confirm, the only step that writes →
 *  a 20-second reminder to upload the signed copy → the new case's page. */
const CaseCreateView: React.FC<CaseCreateViewProps> = ({ cameraIds, solutionId, detailQuery }) => {
  const { modal, message } = App.useApp()
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<{ url: string | null; loading: boolean; failed: boolean }>({ url: null, loading: false, failed: false })
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Between the create call answering and the case number being read back —
  // the confirm button must stay locked or a second click opens a second case.
  const [finishing, setFinishing] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  // The case the reminder leads to; null = saved, but its number wasn't found.
  const savedCaseNoRef = useRef<string | null>(null)
  const reminderDoneRef = useRef(false)
  // Bumped whenever the preview closes, so a render still in flight is dropped.
  const previewRunRef = useRef(0)

  // Device rows for every selected camera. One solution-scoped request covers
  // them all (name / IP / status / ประเภท) — the picker only ever offers
  // cameras from this solution, and the detail page has usually cached it.
  const solutionQuery = useMaintenanceSolution(solutionId)
  const devices: CaseDeviceRow[] = useMemo(() => {
    const byId = new Map((solutionQuery.data?.lists ?? []).map((c) => [c.camera_id, c]))
    return cameraIds.map((cameraId) => {
      const cam = byId.get(cameraId)
      const offlineSince = cam && !cam.status && isRealTimestamp(cam.curl_updated_at)
        ? dayjs(cam.curl_updated_at)
        : null
      return {
        cameraId,
        type: deviceTypeText(cam?.solution_group),
        hostname: cam?.camera_name || cameraId,
        ip: cam?.camera_ip || '-',
        offlineDate: offlineSince ? offlineSince.format('DD MMM BBBB') : '-',
        offlineDays: offlineSince ? offlineDaysSince(cam?.curl_updated_at) : 0,
        isOnline: !!cam?.status,
        hasLive: !!cam?.status,
      }
    })
  }, [cameraIds, solutionQuery.data])

  // Thai type names for the letter — the on-screen table keeps the English
  // badges (user 2026-09-22).
  const letterDeviceType = useMemo(() => {
    const byId = new Map((solutionQuery.data?.lists ?? []).map((c) => [c.camera_id, c]))
    return deviceTypeThaiText(cameraIds.map((id) => byId.get(id)?.solution_group))
  }, [cameraIds, solutionQuery.data])

  const projectQuery = useProjectBySolution(solutionId)
  const projectDetail = projectQuery.data ?? null

  // The case's `contractor_id` must be the tbl_contractors key, but a project
  // only carries its contractor's LOGIN user id — sending that is what made
  // the create 400 ("violates key constraint") and got the field dropped. The
  // contractor list has both ids on each row (user_id is unique across it —
  // checked on prod, 90 rows), so the lookup is exact; no match means we
  // simply send nothing, as before.
  const contractorsQuery = useProjectContractors()
  const caseContractorId = useMemo(() => {
    const userId = projectDetail?.contractor_id
    if (!userId) return undefined
    return (contractorsQuery.data ?? []).find((c) => c.user_id === userId)?.contractor_id
  }, [projectDetail?.contractor_id, contractorsQuery.data])

  const project: CaseProjectInfo = {
    projectName: projectDetail?.project_name || '-',
    contractor: projectDetail?.contractor?.username || '-',
    agency: projectDetail?.department?.department_name || '-',
    contractNo: projectDetail?.contract_no || '-',
    warrantyStart: projectDetail?.warranty_start_date ? dayjs(projectDetail.warranty_start_date).format('DD MMM BBBB') : '-',
    warrantyEnd: projectDetail?.warranty_end_date ? dayjs(projectDetail.warranty_end_date).format('DD MMM BBBB') : '-',
    warrantyStatus: projectDetail ? (projectDetail.is_warranty ? 'active' : 'expired') : 'expired',
  }

  const [form, setForm] = useState<LetterForm>({
    letterNo: '',
    budget: '',
    reason: '',
    assignee: '',
    position: '',
    contact: '',
    contractClause: '',
    reportDate: dayjs().format('DD MMM BBBB'),
    dueDate: '',
  })
  const [letterFiles, setLetterFiles] = useState<UploadFile[]>([])
  const budgetInputRef = useRef<InputRef>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const clearFieldError = (key: string) =>
    setFieldErrors(prev => (prev[key] ? { ...prev, [key]: false } : prev))
  const set = (key: keyof LetterForm) => (value: string) => {
    clearFieldError(key)
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const { mutateAsync: uploadMaintenance } = useUploadMaintenance()
  const uploadFile = useCallback(async (file: UploadFile) => {
    setLetterFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'uploading' } : f)))
    try {
      const fd = new FormData()
      fd.append('upload', await compressImage(file.originFileObj as File))
      const response = await uploadMaintenance(fd)
      const path = response.data?.path?.trim()
      if (!path) throw new Error('อัปโหลดไม่สำเร็จ: ระบบไม่ส่งที่อยู่ไฟล์กลับมา')
      setLetterFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'done', url: path, thumbUrl: path } : f)))
    } catch (err) {
      setLetterFiles(prev => prev.map(f => (f.uid === file.uid ? { ...f, status: 'error' } : f)))
      message.error(err instanceof AxiosError ? (err.response?.data?.message ?? 'อัปโหลดไม่สำเร็จ') : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
    }
  }, [message, uploadMaintenance])

  const uploading = letterFiles.some(f => f.status === 'uploading')

  const createCase = useCreateMaintenanceCase()
  const saving = createCase.isPending

  /** After the reminder: the case that was just opened, so the officer lands
   *  on its tracking page (where the signed copy goes) instead of an
   *  already-saved form. Both the close button and the countdown call it. */
  const finishReminder = useCallback(() => {
    if (reminderDoneRef.current) return
    reminderDoneRef.current = true
    setReminderOpen(false)
    const caseNo = savedCaseNoRef.current
    const params = new URLSearchParams(detailQuery)
    if (caseNo) {
      if (solutionId) params.set('solution_id', String(solutionId))
      const query = params.toString()
      router.push(`/admin/maintenance/case/${caseNo}${query ? `?${query}` : ''}`)
      return
    }
    // Saved, but the number couldn't be read back (no solution context) — leave
    // the form anyway, so it can't be submitted a second time.
    message.info('ระบบเปิด Case ให้แล้ว แต่ยังอ่านเลข Case No. กลับมาไม่ได้ — ดูได้ที่หน้าประวัติการซ่อม')
    const query = params.toString()
    router.push(solutionId ? `/admin/maintenance/detail/${solutionId}${query ? `?${query}` : ''}` : '/admin/maintenance')
  }, [detailQuery, message, router, solutionId])

  /** The create endpoint answers "request successfully" with no case_no, so
   *  the number is read back from the solution's (freshly written) case list.
   *  case_no is `C-YYYYMMDD-NNNN`, zero-padded, so the lexicographic max is
   *  the newest one. ⚠ PENDING BE: have POST return the case_no instead. */
  const resolveNewCaseNo = async (): Promise<string | null> => {
    if (!solutionId) return null
    try {
      const { data } = await getMaintenanceCasesAPI(solutionId)
      const numbers = (data ?? []).map((c) => c.case_no).filter(Boolean)
      return numbers.length > 0 ? numbers.reduce((a, b) => (a > b ? a : b)) : null
    } catch {
      return null
    }
  }

  /** Every letter field is required; the empty ones get a red outline. */
  const validate = (): boolean => {
    const missing: [keyof LetterForm, string][] = []
    if (!form.letterNo.trim()) missing.push(['letterNo', 'เลขที่หนังสือแจ้งซ่อม'])
    if (!form.budget.trim()) missing.push(['budget', 'วงเงินของโครงการ'])
    if (!form.reason.trim()) missing.push(['reason', 'เหตุผลการแจ้งซ่อม'])
    if (!form.assignee.trim()) missing.push(['assignee', 'มอบหมายให้'])
    if (!form.position.trim()) missing.push(['position', 'ตำแหน่ง'])
    if (!form.contact.trim()) missing.push(['contact', 'ช่องทางการติดต่อ'])
    if (!form.contractClause.trim()) missing.push(['contractClause', 'ตามสัญญาจ้างข้อที่'])
    if (!form.reportDate) missing.push(['reportDate', 'ลงวันที่แจ้งซ่อม'])
    if (!form.dueDate) missing.push(['dueDate', 'ลงวันที่ดำเนินการแล้วเสร็จ'])
    if (missing.length > 0) {
      // The empty fields are already outlined in red, so the toast stays short
      // — listing all eight made it span the whole screen (user 2026-09-21).
      setFieldErrors(Object.fromEntries(missing.map(([k]) => [k, true])))
      message.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return false
    }
    // The picker already refuses these days; this catches a form left open
    // past midnight, or a letter date moved after the due date.
    const due = dayjs(form.dueDate, 'DD MMM BBBB', 'th')
    if (!due.isAfter(dayjs(), 'day')) {
      setFieldErrors({ dueDate: true })
      message.error('ลงวันที่ดำเนินการแล้วเสร็จ ต้องเป็นวันพรุ่งนี้เป็นต้นไป')
      return false
    }
    if (!due.isAfter(dayjs(form.reportDate, 'DD MMM BBBB', 'th'), 'day')) {
      setFieldErrors({ dueDate: true })
      message.error('ลงวันที่ดำเนินการแล้วเสร็จ ต้องอยู่หลังลงวันที่แจ้งซ่อม')
      return false
    }
    setFieldErrors({})
    return true
  }

  const statusImageUrls = () => letterFiles
    .filter((f) => f.status === 'done' && f.url)
    .map((f) => f.url as string)

  /** The letter exactly as this form issues it — what the preview shows. */
  const letterInput = (): RepairLetterInput => ({
    // Not issued until the save; it would only name the file anyway.
    caseNo: '',
    project,
    letterNo: form.letterNo,
    // The contract's ลงวันที่ = warranty start (no contract-date column).
    // Raw dates in — the letter formats them itself.
    contractDate: projectDetail?.warranty_start_date,
    letterDate: form.reportDate
      ? dayjs(form.reportDate, 'DD MMM BBBB', 'th').toDate()
      : undefined,
    budget: form.budget,
    defect: form.reason,
    deviceType: letterDeviceType,
    deadline: form.dueDate
      ? dayjs(form.dueDate, 'DD MMM BBBB', 'th').toDate()
      : undefined,
    contractClause: form.contractClause,
    coordinatorName: form.assignee,
    coordinatorPosition: form.position,
    coordinatorPhone: form.contact,
    // What the officer attached. Left empty, the backend builds the sheet from
    // the cameras' frames after the save — too late for this preview.
    deviceStatusImages: statusImageUrls(),
  })

  // The rendered letter is an object URL — release each one once it is
  // replaced, closed, or the page goes away.
  useEffect(() => {
    const url = preview.url
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [preview.url])

  /** บันทึกแบบฟอร์มหนังสือแจ้งซ่อม (header) — check the form, then show the
   *  letter it would issue. Nothing is saved yet. */
  const openPreview = async () => {
    if (uploading || saving || previewOpen) return
    if (!validate()) return
    const run = ++previewRunRef.current
    setPreviewOpen(true)
    setPreview({ url: null, loading: true, failed: false })
    try {
      const [{ renderLetterPdfBlob }, { buildRepairLetter }] = await Promise.all([
        import('@/utils/export/letterPdf'),
        import('../data/repairLetter'),
      ])
      const blob = await renderLetterPdfBlob(buildRepairLetter(letterInput()))
      if (run !== previewRunRef.current) return
      setPreview({ url: URL.createObjectURL(blob), loading: false, failed: false })
    } catch {
      if (run !== previewRunRef.current) return
      setPreview({ url: null, loading: false, failed: true })
    }
  }

  /** แก้ไข / กลับไปแก้ไข, and after a save — close the preview + confirm. */
  const closeLetterModals = () => {
    previewRunRef.current++
    setConfirmOpen(false)
    setPreviewOpen(false)
    setPreview({ url: null, loading: false, failed: false })
  }

  /** บันทึกแบบฟอร์มหนังสือแจ้งซ่อม (confirm) — the one step that writes. */
  const handleConfirmSave = () => {
    if (saving || finishing) return
    const statusImages = statusImageUrls()
    createCase.mutate({
      camera_ids: cameraIds,
      solution_id: solutionId ?? null,
      // Every letter field has a column since the 2026-09-18 backend release,
      // so the letter survives a reload and the backend can render it too.
      document_no: form.letterNo.trim(),
      document_date: form.reportDate
        ? dayjs(form.reportDate, 'DD MMM BBBB', 'th').format('YYYY-MM-DD')
        : null,
      project_budget: parseBudget(form.budget),
      // อาการ/เหตุผลการแจ้งซ่อม — the backend has no separate reason field.
      problem: form.reason.trim(),
      assignee_name: form.assignee.trim(),
      assignee_position: form.position.trim(),
      assignee_contact: form.contact.trim(),
      contract_clause: form.contractClause.trim(),
      responsible: projectDetail?.department?.department_name || undefined,
      // Who the case belongs to. Without it the vendor's notification bell
      // never shows the case — the feed scopes cases by this column, and only
      // the backend's auto-open worker used to fill it (user 2026-09-23).
      ...(caseContractorId ? { contractor_id: caseContractorId } : {}),
      // Leaving the box empty is meaningful: omitting the key makes the backend
      // build the sheet itself from the cameras' live frames.
      ...(statusImages.length > 0 ? { device_status_image: statusImages } : {}),
      due_date: form.dueDate
        ? dayjs(form.dueDate, 'DD MMM BBBB', 'th').format('YYYY-MM-DD')
        : null,
      // TODO(BE): derive contractor_id from solution_id server-side, like the
      // auto-open worker does, so this client-side mapping can go.
    }, {
      onSuccess: async () => {
        setFinishing(true)
        savedCaseNoRef.current = await resolveNewCaseNo()
        setFinishing(false)
        closeLetterModals()
        reminderDoneRef.current = false
        setReminderOpen(true)
      },
      onError: (err) => {
        // Back to the preview — the letter is still the one they checked.
        setConfirmOpen(false)
        const message = err instanceof AxiosError
          ? (err.response?.data?.res_data?.message ?? err.response?.data?.message)
          : undefined
        modal.error({
          title: 'เปิด Case ไม่สำเร็จ',
          content: message ? `เกิดข้อผิดพลาด: ${message}` : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
          okText: 'ตกลง',
          centered: true,
        })
      },
    })
  }

  const labelStyle: React.CSSProperties = { color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }
  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%',
    height: 40,
    background: 'transparent',
    border: `1px solid ${fieldErrors[key] ? '#E94C4C' : '#FCD116'}`,
    borderRadius: 10,
    color: '#FFFFFF',
  })

  const loadingDevices = solutionQuery.isLoading

  return (
    <>
      <TitleSection
        caseId='(ออกอัตโนมัติเมื่อบันทึก)'
        solutionId={solutionId}
        detailQuery={detailQuery}
        subtitle={devices[0]?.hostname}
        warranty={project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ'}
        isOnline={devices.length > 0 && devices.every(d => d.isOnline)}
        rightContent={
          <button
            type='button'
            className={styles.btnPrimary}
            onClick={openPreview}
            disabled={uploading || saving}
            style={{ opacity: uploading || saving ? 0.6 : 1, cursor: uploading || saving ? 'not-allowed' : 'pointer' }}
          >
            {/* Opens the PDF preview — the save itself waits behind its confirm. */}
            {uploading ? 'กำลังอัปโหลด...' : saving ? 'กำลังบันทึก...' : 'บันทึกแบบฟอร์มหนังสือแจ้งซ่อม'}
          </button>
        }
      />

      <section className='mt-4 px-4 md:px-10 flex flex-col xl:flex-row gap-4 items-start'>
        {/* Left: project + devices being opened */}
        <div className='w-full xl:flex-[0_0_46%] flex flex-col gap-4'>
          <ProjectInfoCard project={project} />
          <div className='rounded-2xl p-4 md:p-6' style={{ background: '#191919' }}>
            <div className='flex items-center gap-2'>
              <TbTool size={22} color='#66AEFF' />
              <p style={{ color: '#66AEFF', fontSize: 16, margin: 0 }}>ข้อมูลอุปกรณ์</p>
              <span
                className='ml-auto inline-flex items-center gap-1 px-3 py-0.5 rounded-full'
                style={{ border: '1px solid #E94C4C', color: '#E94C4C', fontSize: 12 }}
              >
                <TbTool size={12} />
                {devices.length}
              </span>
            </div>
            <div className='mt-4'>
              {loadingDevices ? (
                <div className='flex justify-center py-8'><Spin /></div>
              ) : (
                <CaseDeviceTable rows={devices} />
              )}
            </div>
          </div>
        </div>

        {/* Right: letter form */}
        <div className='w-full xl:flex-1 rounded-2xl p-4 md:p-6' style={{ background: '#191919' }}>
          <div className='flex items-start gap-2'>
            <img src={`${BASE_PATH}/images/Maintenance/iccf.png`} alt='' width={30} height={30} />
            <div>
              <p style={{ color: '#FCD116', fontSize: 16, margin: 0 }}>หนังสือแจ้งซ่อม</p>
              <p style={{ color: '#979797', fontSize: 'var(--fs-12)', margin: 0, marginTop: -4 }}>
                เพิ่มข้อมูลที่ใช้ในการออกหนังสือแจ้งซ่อมไปยังผู้รับจ้าง
              </p>
            </div>
          </div>
          <p className='mt-4' style={{ color: '#FFFFFF', fontSize: 16, margin: 0 }}>ข้อมูลการแจ้งซ่อม</p>

          <div className='mt-3 flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <p style={labelStyle}>เลขที่หนังสือแจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input
                placeholder='กรุณาระบุเลขที่หนังสือแจ้งซ่อม เช่น คค 0729.2/2569...'
                style={inputStyle('letterNo')}
                value={form.letterNo}
                onChange={(e) => set('letterNo')(e.target.value)}
              />
            </div>
            <div className='flex-1'>
              <p style={labelStyle}>วงเงินของโครงการ<span style={{ color: '#E94C4C' }}>*</span></p>
              {/* Thousands commas as it is typed (user 2026-09-28); `parseBudget`
                  strips them again for the request. */}
              <Input
                ref={budgetInputRef}
                inputMode='decimal'
                placeholder='กรุณาระบุวงเงินของโครงการ เช่น 5,000,000...'
                style={inputStyle('budget')}
                value={form.budget}
                onChange={(e) => {
                  const typed = e.target.value
                  const next = formatBudgetInput(typed)
                  const caret = caretAfterFormat(next, significantBefore(typed, e.target.selectionStart ?? typed.length))
                  set('budget')(next)
                  // The re-render would otherwise drop the caret at the end.
                  requestAnimationFrame(() => budgetInputRef.current?.input?.setSelectionRange(caret, caret))
                }}
              />
            </div>
          </div>

          <div className='mt-3'>
            <p style={labelStyle}>เหตุผลการแจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
            <Input.TextArea
              placeholder='กรุณาระบุเหตุผลหรือปัญหาที่พบ...'
              style={{ background: 'transparent', border: `1px solid ${fieldErrors.reason ? '#E94C4C' : '#FCD116'}`, borderRadius: 10, color: '#FFFFFF', resize: 'none' }}
              autoSize={{ minRows: 3, maxRows: 5 }}
              value={form.reason}
              onChange={(e) => set('reason')(e.target.value)}
            />
          </div>

          <div className='mt-3 flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <p style={labelStyle}>มอบหมายให้<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input
                placeholder='กรุณาระบุคำนำหน้าและชื่อ-นามสกุลผู้ที่ได้รับมอบหมาย...'
                style={inputStyle('assignee')}
                value={form.assignee}
                onChange={(e) => set('assignee')(e.target.value)}
              />
            </div>
            <div className='flex-1'>
              <p style={labelStyle}>ตำแหน่ง<span style={{ color: '#E94C4C' }}>*</span></p>
              {/* Free text — the chevron was dropped (user 2026-09-21): there
                * is no position list to pick from, so the affordance lied. */}
              <Input
                placeholder='กรุณาระบุตำแหน่งผู้ที่ได้รับมอบหมาย...'
                style={inputStyle('position')}
                value={form.position}
                onChange={(e) => set('position')(e.target.value)}
              />
            </div>
          </div>

          <div className='mt-3 flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <p style={labelStyle}>ช่องทางการติดต่อ<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input
                placeholder='กรุณาระบุเบอร์ติดต่อ...'
                style={inputStyle('contact')}
                value={form.contact}
                onChange={(e) => set('contact')(e.target.value)}
              />
            </div>
            <div className='flex-1'>
              <p style={labelStyle}>ตามสัญญาจ้างข้อที่<span style={{ color: '#E94C4C' }}>*</span></p>
              <Input
                placeholder='กรุณาเลขที่ตามสัญญาจ้าง...'
                style={inputStyle('contractClause')}
                value={form.contractClause}
                onChange={(e) => set('contractClause')(e.target.value)}
              />
            </div>
          </div>

          <p className='mt-4' style={{ color: '#FFFFFF', fontSize: 16, margin: 0 }}>รูปภาพสถานะการทำงานของอุปกรณ์</p>
          <div className='mt-2'>
            <Upload.Dragger
              style={{ background: 'transparent', border: '1px dashed #FFFFFF66', borderRadius: 10, textAlign: 'center' }}
              className='maintenance-upload-dragger'
              accept='.jpg,.jpeg,.png'
              showUploadList={false}
              multiple
              // Controlled — see the note in ContractorCaseView: an uncontrolled
              // list resurrects files the user deleted.
              fileList={letterFiles}
              beforeUpload={(file) => {
                if (!LETTER_UPLOAD_TYPES.includes(file.type)) {
                  message.error('รองรับเฉพาะไฟล์ JPG, JPEG, PNG')
                  return Upload.LIST_IGNORE
                }
                if (file.size > MAX_UPLOAD_SIZE) {
                  message.error('ไฟล์ที่อัปโหลดมีขนาดเกิน 200 MB')
                  return Upload.LIST_IGNORE
                }
                return false
              }}
              onChange={({ fileList }) => {
                const added = fileList.filter(f => !letterFiles.some(existing => existing.uid === f.uid))
                const slots = MAX_FILES - letterFiles.length
                if (added.length > slots) message.warning(`แนบได้ไม่เกิน ${MAX_FILES} ไฟล์`)
                const accepted = added.slice(0, Math.max(0, slots))
                if (accepted.length === 0) return
                setLetterFiles(prev => [...prev, ...accepted])
                accepted.forEach(f => uploadFile(f))
              }}
            >
              <img src={`${BASE_PATH}/images/Maintenance/cloud-upload.png`} alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontSize: 10, margin: '2px 0 0 0' }}>ไฟล์ JPG, JPEG, PNG (สูงสุด {MAX_FILES} ไฟล์)</p>
            </Upload.Dragger>
            {letterFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {letterFiles.map((file) => (
                  <div key={file.uid} className={styles.imagePreviewItem} style={{ background: '#2A2A2A' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {file.status === 'uploading' ? (
                        <Spin size='small' />
                      ) : file.thumbUrl ? (
                        <img src={file.thumbUrl} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <TbFileText size={32} color={file.status === 'error' ? '#E94C4C' : '#FCD116'} />
                      )}
                    </div>
                    <div
                      className={styles.imagePreviewOverlay}
                      onClick={() => setLetterFiles(prev => prev.filter(f => f.uid !== file.uid))}
                    >
                      <TbTrash size={24} color='#FFFFFF' />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className='mt-4' style={{ color: '#FFFFFF', fontSize: 16, margin: 0 }}>ระยะเวลาในการซ่อมแซมอุปกรณ์</p>
          <ConfigProvider locale={thTH}>
            <div className='mt-3 flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <p style={labelStyle}>ลงวันที่แจ้งซ่อม<span style={{ color: '#E94C4C' }}>*</span></p>
                <DatePicker
                  placeholder='กรุณาเลือกวันที่...'
                  format='DD MMM BBBB'
                  style={{ ...inputStyle('reportDate'), color: undefined }}
                  suffixIcon={<img src={`${BASE_PATH}/images/Maintenance/icdate.png`} alt='' width={24} height={24} />}
                  value={form.reportDate ? dayjs(form.reportDate, 'DD MMM BBBB', 'th') : null}
                  onChange={(date) => set('reportDate')(date ? date.format('DD MMM BBBB') : '')}
                />
              </div>
              <div className='flex-1'>
                <p style={labelStyle}>ลงวันที่ดำเนินการแล้วเสร็จ<span style={{ color: '#E94C4C' }}>*</span></p>
                <DatePicker
                  placeholder='กรุณาเลือกวันที่...'
                  format='DD MMM BBBB'
                  // From tomorrow on — never today or earlier (user 2026-09-28),
                  // and never on or before the letter's own date.
                  disabledDate={(day) =>
                    !day.isAfter(dayjs(), 'day') ||
                    (!!form.reportDate && !day.isAfter(dayjs(form.reportDate, 'DD MMM BBBB', 'th'), 'day'))
                  }
                  style={{ ...inputStyle('dueDate'), color: undefined }}
                  suffixIcon={<img src={`${BASE_PATH}/images/Maintenance/icdate.png`} alt='' width={24} height={24} />}
                  value={form.dueDate ? dayjs(form.dueDate, 'DD MMM BBBB', 'th') : null}
                  onChange={(date) => set('dueDate')(date ? date.format('DD MMM BBBB') : '')}
                />
              </div>
            </div>
          </ConfigProvider>
        </div>
      </section>

      <LetterPreviewModal
        open={previewOpen}
        url={preview.url}
        loading={preview.loading}
        failed={preview.failed}
        title='ตัวอย่างแบบฟอร์มหนังสือแจ้งซ่อม'
        subtitle='กรุณาตรวจสอบความถูกต้องของเอกสารก่อนบันทึก'
        loadingText='กำลังสร้างตัวอย่างเอกสาร...'
        failedText='สร้างตัวอย่างเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง'
        note={statusImageUrls().length === 0
          ? 'หน้าแนบรูปภาพสถานะการทำงานของอุปกรณ์ ระบบจะสร้างจากภาพล่าสุดของอุปกรณ์ให้หลังบันทึก จึงยังไม่แสดงในตัวอย่างนี้'
          : undefined}
        onClose={closeLetterModals}
        actions={
          <>
            <button type='button' className={previewActionButton} style={{ background: '#C4C4C4', color: '#212121' }} onClick={closeLetterModals}>
              แก้ไข
            </button>
            <button type='button' className={previewActionButton} style={{ background: '#FCD116', color: '#212121' }} onClick={() => setConfirmOpen(true)} disabled={preview.loading}>
              บันทึก
            </button>
          </>
        }
      />
      <ConfirmCreateLetterModal
        open={confirmOpen}
        saving={saving || finishing}
        onBack={closeLetterModals}
        onConfirm={handleConfirmSave}
      />
      <SignedLetterReminderModal open={reminderOpen} onClose={finishReminder} />
    </>
  )
}

export default React.memo<CaseCreateViewProps>(CaseCreateView)
