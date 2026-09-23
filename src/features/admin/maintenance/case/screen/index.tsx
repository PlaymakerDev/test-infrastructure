"use client"
import React, { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spin } from 'antd'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import OfficerCaseView from '../components/OfficerCaseView'
import ContractorCaseView from '../components/ContractorCaseView'
import CaseCreateView from '../components/CaseCreateView'
import type { CaseDeviceRow, CaseProjectInfo } from '../components/caseViewTypes'
import {
  useMaintenanceCase,
  useMaintenanceSolution,
  useProjectBySolution,
} from '@/hooks/queries/maintenance'
import { useCCTVDetail } from '@/hooks/queries/shared/useCCTVDetail'
import { CCTVModal } from '@/components/modal'
import type { CameraSolutionGroup, CaseDetail } from '@/types/maintenance'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'
import { useUserKind } from '@/utils/hooks/useUserKind'
import { isRealTimestamp, offlineDaysSince } from '../../data/offlineDays'
import { deviceTypeText, deviceTypeThaiText } from '../../data/deviceTypes'
import { parseImageUrls } from '../../data/parseImageUrls'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

const normalizeSolutionType = (value: string | null): string =>
  (value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

/** Case page — split into TWO role views since the 2026-09-11 redesign:
 *  - เจ้าหน้าที่ (OfficerCaseView): ออกหนังสือแจ้งซ่อม + ติดตามสถานะ
 *  - ผู้รับจ้าง (ContractorCaseView): บันทึกแจ้งซ่อม + ปิด Case
 *
 *  The account kind comes from the session (resolved at login — see
 *  SessionData.user_kind), so a contractor lands on their own view without
 *  any query param. `?role=contractor` stays as a manual override so an
 *  officer can preview what the vendor sees. */
const CaseContent: React.FC<Props> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userKind } = useUserKind()

  const role: 'officer' | 'contractor' =
    searchParams.get('role') === 'contractor' || userKind === 'contractor'
      ? 'contractor'
      : 'officer'

  const caseQuery = useMaintenanceCase(id)
  const caseData: CaseDetail | null = caseQuery.data ?? null
  const loading = caseQuery.isLoading

  // The backend scopes cases to the caller (a contractor only sees its own), so
  // a 403 here means "not yours" rather than a failure worth retrying.
  const isForbidden = caseQuery.error instanceof AxiosError && caseQuery.error.response?.status === 403
  const error = caseQuery.isError
    ? (isForbidden ? 'คุณไม่มีสิทธิ์เข้าถึง Case นี้' : 'ไม่สามารถโหลดข้อมูล Case ได้')
    : null

  // Was the case already closed when this page opened? Captured once per case
  // (adjust-during-render) — see the view switch at the bottom.
  const [openedWith, setOpenedWith] = useState<{ caseNo: string; closed: boolean } | null>(null)
  if (caseData && openedWith?.caseNo !== caseData.case_no) {
    setOpenedWith({ caseNo: caseData.case_no, closed: caseData.status === 'closed' })
  }
  const openedClosed = openedWith?.closed ?? false

  // ข้อมูลอุปกรณ์ — the case now carries its own device list (`cameras[]`,
  // backend release 2026-09-16, which also dropped the old single `camera_id`).
  const caseCameras = caseData?.cameras ?? []
  const firstCameraId = caseCameras[0]?.camera_id

  // The explicit URL solution identifies which detail row opened this case;
  // cases created since the 2026-09-16 backend release carry `solution_id`
  // themselves. Cases older than that have it null, so the camera-relation
  // fallback below still earns its keep: resolve the named solution_type
  // relationship, and for a bare direct URL fall back only when the camera has
  // exactly one distinct related solution — never silently pick the first when
  // a camera participates in several.
  const cameraDetailQuery = useCCTVDetail(firstCameraId)
  const cameraDetail = cameraDetailQuery.data ?? null
  const requestedSolutionType = normalizeSolutionType(searchParams.get('solution_type'))
  const relatedSolutions = cameraDetail
    ? [
      { types: ['counting', 'trafficvolume'], solution: cameraDetail.counting },
      { types: ['analytic', 'trafficanalytic'], solution: cameraDetail.analytic },
      { types: ['traffic', 'trafficlighting'], solution: cameraDetail.traffic },
      { types: ['crosswalk'], solution: cameraDetail.crosswalk },
      { types: ['wim', 'weightinmotion'], solution: cameraDetail.wim_camera },
      { types: ['vms'], solution: cameraDetail.vms },
    ]
    : []
  const typeMatchedSolutionId = requestedSolutionType
    ? relatedSolutions.find(({ types }) => types.includes(requestedSolutionType))?.solution?.solution_id
    : undefined
  const uniqueRelatedSolutionIds = Array.from(new Set(
    relatedSolutions
      .map(({ solution }) => solution?.solution_id)
      .filter((value): value is number => typeof value === 'number' && value > 0),
  ))
  const fallbackSolutionId = typeMatchedSolutionId ?? (
    !requestedSolutionType && uniqueRelatedSolutionIds.length === 1
      ? uniqueRelatedSolutionIds[0]
      : undefined
  )
  const parsedSolutionId = Number(searchParams.get('solution_id'))
  const routeSolutionId = Number.isFinite(parsedSolutionId) && parsedSolutionId > 0
    ? parsedSolutionId
    : undefined
  const caseSolutionId = caseData?.solution_id && caseData.solution_id > 0 ? caseData.solution_id : undefined
  const solutionId = routeSolutionId ?? caseSolutionId ?? fallbackSolutionId
  const returnToAllRepairs = searchParams.get('source') === 'all_repairs'
  const returnToRepairHistory = searchParams.get('source') === 'repair_history'
  const parsedContextId = Number(searchParams.get('context_id'))
  const hasMatchingDetailContext = solutionId !== undefined &&
    Number.isFinite(parsedContextId) &&
    parsedContextId === solutionId

  // Preserve detail-page context only when it belongs to this case's solution.
  // `role` is deliberately KEPT — a contractor navigating back must stay in
  // contractor mode (detail page hides its เปิด Case buttons off that param).
  const detailParams = new URLSearchParams(searchParams.toString())
  detailParams.delete('solution_id')
  const detailQuery = hasMatchingDetailContext && routeSolutionId !== undefined
    ? detailParams.toString()
    // Even without detail context, a contractor's back-navigation must keep
    // contractor mode so the detail page keeps its เปิด Case buttons hidden.
    : role === 'contractor' ? 'role=contractor' : ''

  const projectBySolutionQuery = useProjectBySolution(solutionId)
  const projectDetail = projectBySolutionQuery.data ?? null

  const project: CaseProjectInfo = {
    projectName: projectDetail?.project_name || '-',
    contractor: projectDetail?.contractor?.username || '-',
    agency: projectDetail?.department?.department_name || caseData?.responsible || '-',
    contractNo: projectDetail?.contract_no || '-',
    warrantyStart: projectDetail?.warranty_start_date ? dayjs(projectDetail.warranty_start_date).format('DD MMM BBBB') : '-',
    warrantyEnd: projectDetail?.warranty_end_date ? dayjs(projectDetail.warranty_end_date).format('DD MMM BBBB') : '-',
    warrantyStatus: projectDetail ? (projectDetail.is_warranty ? 'active' : 'expired') : 'expired',
  }

  // One row per device on the case. "Offline since" only means something when
  // the camera is actually offline AND the backend has a real curl_updated_at
  // (not the Go zero-value sentinel it sends when it never checked in).
  // ประเภทอุปกรณ์ — the case payload has no `solution_group`, so the types come
  // from the owning solution's camera list (usually already cached by the
  // detail page). ⚠ PENDING BE: ship solution_group inside case `cameras[]`.
  const solutionCamerasQuery = useMaintenanceSolution(solutionId)
  const groupsByCamera = useMemo(() => {
    const map: Record<string, CameraSolutionGroup[] | null | undefined> = {}
    for (const cam of solutionCamerasQuery.data?.lists ?? []) {
      map[cam.camera_id] = cam.solution_group
    }
    return map
  }, [solutionCamerasQuery.data])
  const typeTextByCamera = useMemo(() => {
    const map: Record<string, string> = {}
    for (const [id, groups] of Object.entries(groupsByCamera)) {
      map[id] = deviceTypeText(groups)
    }
    return map
  }, [groupsByCamera])

  const devices: CaseDeviceRow[] = caseCameras.map((cam) => {
    const offlineSince = !cam.status && isRealTimestamp(cam.curl_updated_at)
      ? dayjs(cam.curl_updated_at)
      : null
    return {
      cameraId: cam.camera_id,
      type: typeTextByCamera[cam.camera_id] ?? 'CCTV',
      hostname: cam.camera_name || cam.camera_id,
      ip: cam.camera_ip || '-',
      offlineDate: offlineSince ? offlineSince.format('DD MMM BBBB') : '-',
      offlineDays: offlineSince ? offlineDaysSince(cam.curl_updated_at) : 0,
      isOnline: cam.status,
      // The CCTV modal resolves its own stream from the camera id.
      hasLive: cam.status,
    }
  })

  // หนังสือแจ้งซ่อม — the ministry's outgoing letter (ครุฑ letterhead, TH
  // Sarabun New). Direct download per the agreed flow (no export dialog).
  const handleExportLetter = async () => {
    const [{ exportLetterPdf }, { buildRepairLetter }] = await Promise.all([
      import('@/utils/export/letterPdf'),
      import('../data/repairLetter'),
    ])
    // Every letter field is stored on the case since the 2026-09-18 backend
    // release, so re-issuing the letter reproduces what the officer filed —
    // including the device-status sheet (theirs, or the one the backend built).
    await exportLetterPdf(buildRepairLetter({
      caseNo: id,
      project,
      letterNo: caseData?.document_no,
      letterDate: caseData?.document_date ?? caseData?.created_at,
      // The contract's ลงวันที่ = warranty start (no contract-date column).
      // Raw dates — the letter formats them full-month itself.
      contractDate: projectDetail?.warranty_start_date,
      budget: caseData?.project_budget != null ? String(caseData.project_budget) : undefined,
      defect: caseData?.problem,
      // Thai, and every type on the case — the letter is a formal document,
      // not the table's English badge (user 2026-09-22).
      deviceType: deviceTypeThaiText(caseCameras.map((c) => groupsByCamera[c.camera_id])),
      deadline: caseData?.due_date,
      contractClause: caseData?.contract_clause,
      coordinatorName: caseData?.assignee_name,
      coordinatorPosition: caseData?.assignee_position,
      coordinatorPhone: caseData?.assignee_contact,
      deviceStatusImages: parseImageUrls(caseData?.device_status_image),
    }))
  }

  const handleGoToDetail = () => {
    if (solutionId) {
      router.push(`/admin/maintenance/detail/${solutionId}${detailQuery ? `?${detailQuery}` : ''}`)
    } else {
      router.push('/admin/maintenance?repair')
    }
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
    <div className='main-screen maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      <style>{`
        .maintenance-upload-dragger .ant-upload {
          padding: 8px !important;
        }
        .maintenance-upload-dragger .ant-upload-drag {
          min-height: unset !important;
        }
      `}</style>

      {/* A closed case is history for everyone: the contractor gets the same
        * read-only tracking view the officer sees, not an editable form they
        * can no longer submit (user 2026-09-21). Judged by the status the case
        * had when this page opened — switching the instant a save closes it
        * would unmount the form together with its own success dialog. */}
      {role === 'contractor' && !openedClosed ? (
        <ContractorCaseView
          caseId={id}
          caseData={caseData}
          project={project}
          devices={devices}
          solutionId={solutionId}
          detailQuery={detailQuery}
          returnToAllRepairs={returnToAllRepairs}
          returnToRepairHistory={returnToRepairHistory}
          onExportLetter={handleExportLetter}
        />
      ) : (
        <OfficerCaseView
          caseId={id}
          caseData={caseData}
          project={project}
          devices={devices}
          solutionId={solutionId}
          detailQuery={detailQuery}
          returnToAllRepairs={returnToAllRepairs}
          returnToRepairHistory={returnToRepairHistory}
          onGoToDetail={handleGoToDetail}
          onExportLetter={handleExportLetter}
        />
      )}

      {/* Global CCTV modal — fires from the Live buttons in ข้อมูลอุปกรณ์. */}
      <CCTVModal />
    </div>
  )
}

/** /admin/maintenance/case/new — the letter-creation flow entered from the
 *  OpenCaseModal. No case exists yet; devices arrive via `camera_ids`. */
const CaseCreateContent: React.FC = () => {
  const searchParams = useSearchParams()
  const cameraIds = (searchParams.get('camera_ids') ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const parsedSolutionId = Number(searchParams.get('solution_id') ?? searchParams.get('context_id'))
  const solutionId = Number.isFinite(parsedSolutionId) && parsedSolutionId > 0 ? parsedSolutionId : undefined
  const detailParams = new URLSearchParams(searchParams.toString())
  detailParams.delete('solution_id')
  detailParams.delete('camera_ids')
  detailParams.delete('role')
  // Never inherit a stale entry point — a case created here belongs to the
  // device table it was opened from.
  detailParams.delete('source')

  return (
    <div className='main-screen maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      <style>{`
        .maintenance-upload-dragger .ant-upload {
          padding: 8px !important;
        }
        .maintenance-upload-dragger .ant-upload-drag {
          min-height: unset !important;
        }
      `}</style>
      <CaseCreateView
        cameraIds={cameraIds}
        solutionId={solutionId}
        detailQuery={detailParams.toString()}
      />
    </div>
  )
}

const MaintenanceCaseScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      {id === 'new' ? <CaseCreateContent /> : <CaseContent id={id} />}
    </Suspense>
  )
}

export default React.memo<Props>(MaintenanceCaseScreen)
