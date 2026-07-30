import { getDepartmentByRoadAPI } from '@/services/routes/SharedService'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseContactDetail } from '@/types/shared'
import { useQuery } from '@tanstack/react-query'
import { ConfigProvider, Empty, Modal, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbCalendarEvent, TbClipboard, TbFileDescription, TbHourglass, TbUser, TbUserShield } from 'react-icons/tb'
import { useContactDetail } from '@/hooks/queries/shared/useContactDetail'
import { useDepartments, useProjectDetail } from '@/hooks/queries/manage'

/** Per-status styling for both the title pill and the "ระยะเวลาที่เหลือ"
 *  text. Two separate axes:
 *
 *    badge    — outlined pill colour; mirrors the table pill so users see
 *               the same colour cue across overall + modal. `ก่อนค้ำ` adds a
 *               yellow state the table doesn't have yet.
 *    remainingClass — Tailwind class for the "X วัน" countdown text +
 *               hourglass icon. Sky/red/default per spec.
 */
const WARRANTY_STATE: Record<
  string,
  { badge: string; remainingClass: string }
> = {
  ในค้ำ: { badge: '#05F2DB', remainingClass: 'text-[#66AEFF]' },
  หมดค้ำ: { badge: '#979797', remainingClass: 'text-red-400' },
  ก่อนค้ำ: { badge: '#FCD116', remainingClass: 'text-white' },
}

const NEUTRAL_WARRANTY = { badge: '#979797', remainingClass: 'text-gray-400' }

const getWarrantyUi = (status?: string) =>
  (status && WARRANTY_STATE[status]) || NEUTRAL_WARRANTY

interface ContentProps {
  data?: APIResponseContactDetail
  roadId?: number | string | null;
  projectId?: number | string | null;
}

const Content = (props: ContentProps) => {
  const { data, roadId, projectId } = props

  const { data: roadData, isLoading: roadLoading, isError: roadError } = useQuery({
    // Include roadId in the key — without it TanStack Query reuses the first
    // result for every subsequent road click, showing stale data.
    queryKey: ['road_detail', roadId],
    queryFn: () => getDepartmentByRoadAPI({ road_id: Number(roadId)! }),
    enabled: !!roadId,
    // placeholderData: keepPreviousData
  })

  // `/manage/contract/{id}` (the `data` prop above) always sends `department_name: ""` —
  // it's not a real data source. "ผู้ว่าจ้าง" is the PROJECT's own owning department
  // (project.department_id), same field the settings ผู้ว่าจ้าง dropdown edits —
  // resolved here via `/manage/project/{id}` + a client-side join against the
  // department list (mirrors ProjectModal.tsx's `ownerOptions`).
  const { data: projectDetail, isLoading: projectLoading, isError: projectError } = useProjectDetail(
    projectId != null ? Number(projectId) : null
  )
  const { data: departments } = useDepartments()
  const ownerDepartmentName = useMemo(() => {
    if (projectDetail?.department_id == null) return undefined
    return (departments ?? []).find((d) => d.id === projectDetail.department_id)?.department_short_name
  }, [departments, projectDetail])

  // Backend computes `warranty_date` (remaining days) + `warranty_status`
  // directly. No more FE date parsing — just consume.
  const warrantyUi = getWarrantyUi(data?.warranty_status)

  const renderDepartmentName = useMemo(() => {
    if (roadLoading) return <Skeleton loading={roadLoading} active paragraph={false} />
    if (roadError) return <span className='text-red-500'>-</span>
    return roadData?.data.department_name || '-'
  }, [roadData, roadLoading, roadError])

  const renderOwnerName = useMemo(() => {
    if (projectLoading) return <Skeleton loading={projectLoading} active paragraph={false} />
    if (projectError) return <span className='text-red-500'>-</span>
    return ownerDepartmentName || '-'
  }, [ownerDepartmentName, projectLoading, projectError])

  return (
    <>
      <div className='mb-5'>
        <p className='fs-12'>{data?.project_name || '-'}</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-4 mb-6 justify-items-center'>
        <div className='flex flex-col items-center text-center'>
          <TbFileDescription className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เลขที่สัญญา</p>
          <p className='fs-12 text-white mb-0'>{data?.contract_no || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUserShield className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>หน่วยงานรับผิดชอบ</p>
          {/* div, not p — Skeleton renders an <h3> internally and <h3> can
            * not be a descendant of <p> (causes a hydration error). */}
          <div className='fs-12 text-white mb-0'>{renderDepartmentName}</div>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbUser className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ผู้ว่าจ้าง</p>
          <div className='fs-12 text-white mb-0'>{renderOwnerName}</div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4'>
        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>เริ่มต้นการรับประกัน</p>
          <p className='fs-12 text-white mb-0'>{data?.warranty_start_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>สิ้นสุดการรับประกัน</p>
          <p className='fs-12 text-white mb-0'>{data?.warranty_end_date || '-'}</p>
        </div>

        <div className='flex flex-col items-center text-center'>
          {(() => {
            // Per-status content for the remaining/elapsed time cell.
            // Backend's `warranty_date` semantics:
            //   ในค้ำ   → positive (days remaining)
            //   หมดค้ำ  → negative (days elapsed since expiry — `Math.abs`)
            //   ก่อนค้ำ → render "-" (warranty hasn't started; value n/a)
            const status = data?.warranty_status
            const days = data?.warranty_date
            let label = 'ระยะเวลาที่เหลือ'
            let value: string = '-'
            // Missing data is unknown, not a genuine zero-day warranty.
            if (!data) {
              value = '-'
            } else if (status === 'หมดค้ำ') {
              label = 'หมดค้ำประกัน'
              value = days != null ? `${Math.abs(days)} วัน` : '-'
            } else if (status === 'ก่อนค้ำ') {
              label = 'อยู่ระหว่างการส่งมอบงาน'
              value = '-'
            } else {
              // Default: in-warranty / unknown — show BE's remaining days.
              value = `${days ?? 0} วัน`
            }
            return (
              <>
                <TbHourglass className={`fs-22 mb-2 ${warrantyUi.remainingClass}`} />
                <p className='fs-12 text-gray-400 mb-0.5'>{label}</p>
                <p className={`fs-12 mb-0 ${warrantyUi.remainingClass}`}>{value}</p>
              </>
            )
          })()}
        </div>

        <div className='flex flex-col items-center text-center'>
          <TbCalendarEvent className='fs-22 text-white mb-2' />
          <p className='fs-12 text-gray-400 mb-0.5'>ผู้รับจ้าง</p>
          <p className='fs-12 text-white mb-0'>{data?.company_name || '-'}</p>
        </div>
      </div>
    </>
  )
}

const ProjectInfoModal: React.FC = () => {
  const { open, project_id, road_id } = useAppSelector(state => state.layout.project_info_modal)
  const dispatch = useAppDispatch()

  const { data, isLoading, isError } = useContactDetail(project_id)

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูลโครงการ" />
    return <Content data={data?.data} roadId={road_id} projectId={project_id} />
  }, [isLoading, isError, data, road_id, project_id])

  // Warranty pill style for the title — text uses the BE Thai label as-is.
  const warrantyStatus = data?.data?.warranty_status
  const titleWarrantyUi = getWarrantyUi(warrantyStatus)

  // Custom title — icon + label + warranty pill on the right side.
  const titleNode = useMemo(
    () => (
      <div className='flex items-center gap-2'>
        <TbClipboard className='fs-22' style={{ color: '#66AEFF' }} />
        <span className='fs-18 font-semibold' style={{ color: '#66AEFF' }}>
          ข้อมูลโครงการ
        </span>
        <span
          className='inline-flex items-center justify-center py-0.5 px-3 rounded-full fs-12 whitespace-nowrap border ml-1'
          style={{ border: `1px solid ${titleWarrantyUi.badge}`, color: titleWarrantyUi.badge }}
        >
          {warrantyStatus || '-'}
        </span>
      </div>
    ),
    [titleWarrantyUi, warrantyStatus],
  )

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}>
      <Modal
        title={titleNode}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => dispatch(resetProjectInfoModalOpen())}
        onCancel={() => dispatch(resetProjectInfoModalOpen())}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={800}
      >
        {renderContent}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo(ProjectInfoModal)
