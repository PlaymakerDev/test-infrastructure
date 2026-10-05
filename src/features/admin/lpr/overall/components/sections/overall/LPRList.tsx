"use client"
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TbCamera,
  TbWifi,
  TbWifiOff,
  TbInfoSquareRoundedFilled,
} from 'react-icons/tb'
import { Empty, Skeleton, Tooltip } from 'antd'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { ListData, SubDptSolution } from '@/types/lpr/new-lpr-api'
import { groupLPRSections } from '../../../data/groupLPRList'

// ── Pill badge ───────────────────────────────────────────────────────────────

const Pill: React.FC<{ text: string; color: string; icon?: React.ReactNode }> = ({
  text,
  color,
  icon,
}) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1.5px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

// ── Single install-point card ────────────────────────────────────────────────

/** One LPR install-point card — same layout as the CCTV card (CardGridCctv):
 *  yellow project title, road-code / warranty pills + ⓘ Project-Info icon,
 *  จุดติดตั้ง link + เลขที่สัญญา rows, and a camera stat trio. LPR adds the
 *  solution's own ออนไลน์/ออฟไลน์ pill (the status chips filter on it). */
const LPRCard: React.FC<{
  item: SubDptSolution;
  // onDetail: () => void
}> = ({
  item,
  // onDetail
}) => {
    const dispatch = useAppDispatch()
    const project = item.project
    const warrantyColor = item.is_warranty ? '#05F2DB' : '#979797'
    const warrantyText = item.is_warranty ? 'ในค้ำ' : 'หมดค้ำ'
    // No contract → show the budget year (พ.ศ.) and disable the project ⓘ.
    const hasContract = !!(project?.contract_no && project.contract_no.trim())
    const contractText = hasContract
      ? project?.contract_no
      : project?.budget_year
        ? `ปีงบประมาณ ${project.budget_year}`
        : '-'
    const lpr = item.lpr

    return (
      <div
        className='flex flex-col gap-4 rounded-2xl p-5'
        style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
      >
        {/* Title — project name. Clamped so long names don't make cards wildly
        * different heights; full text on hover. */}
        <Tooltip title={project?.project_name}>
          <h4 className='font-normal! text-(--yellow) leading-snug mb-0 line-clamp-2 wrap-break-word'>
            {project?.project_name || '-'}
          </h4>
        </Tooltip>

        {/* Badges row */}
        <div className='flex flex-wrap items-center gap-2'>
          <Pill text={item.road?.code_name || '-'} color='#66AEFF' />
          <Pill text={warrantyText} color={warrantyColor} />
          {item.is_online ? (
            <Pill text='ออนไลน์' color='#66AEFF' icon={<TbWifi size={14} />} />
          ) : (
            <Pill text='ออฟไลน์' color='#E94C4C' icon={<TbWifiOff size={14} />} />
          )}
          <TbInfoSquareRoundedFilled
            size={32}
            className={hasContract ? 'cursor-pointer hover:text-(--yellow)' : 'cursor-not-allowed'}
            style={{ color: hasContract ? '#ffffff' : '#555' }}
            title={hasContract ? 'ดูข้อมูลโครงการ' : 'ไม่มีข้อมูลโครงการ'}
            onClick={
              hasContract
                ? () =>
                  dispatch(
                    setProjectInfoModalOpen({
                      open: true,
                      project_id: project?.id ?? null,
                      road_id: item.road?.id ?? null,
                    }),
                  )
                : undefined
            }
          />
        </div>

        {/* Info rows */}
        <div className='flex flex-col gap-1.5 fs-12'>
          <div className='flex gap-2'>
            <span className='text-white/50 whitespace-nowrap shrink-0'>จุดติดตั้ง :</span>
            <span
              className='text-white'
              tabIndex={0}
            >
              {item.solution?.solution_name || '-'}
            </span>
            {/* <span
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={onDetail}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onDetail()
              }
            }}
            role='link'
            tabIndex={0}
          >
            {item.solution?.solution_name || '-'}
          </span> */}
          </div>
          <div className='flex gap-2'>
            <span className='text-white/50 whitespace-nowrap shrink-0'>เลขที่สัญญา :</span>
            <span className='text-white'>{contractText}</span>
          </div>
        </div>

        {/* Stats — กล้องตรวจจับป้ายทะเบียน: ทั้งหมด / ออนไลน์ / ออฟไลน์ */}
        <div className='flex items-center justify-around pt-2'>
          <div className='flex flex-col items-center gap-2'>
            <span className='fs-24 font-bold tabular-nums leading-none text-white'>
              {(lpr?.total_camera ?? 0).toLocaleString('th-TH')}
            </span>
            <div className='flex items-center gap-1 fs-12 text-white/50'>
              <TbCamera size={16} />
              <span>กล้องทั้งหมด</span>
            </div>
          </div>

          <div className='flex flex-col items-center gap-2'>
            <span
              className='fs-24 font-bold tabular-nums leading-none'
              style={{ color: !lpr?.total_online ? '#66AEFF55' : '#66AEFF' }}
            >
              {(lpr?.total_online ?? 0).toLocaleString('th-TH')}
            </span>
            <div className='flex items-center gap-1 fs-12' style={{ color: '#66AEFF99' }}>
              <TbWifi size={16} />
              <span>ออนไลน์</span>
            </div>
          </div>

          <div className='flex flex-col items-center gap-2'>
            <span
              className='fs-24 font-bold tabular-nums leading-none'
              style={{ color: !lpr?.total_offline ? '#E94C4C55' : '#E94C4C' }}
            >
              {(lpr?.total_offline ?? 0).toLocaleString('th-TH')}
            </span>
            <div className='flex items-center gap-1 fs-12' style={{ color: '#E94C4C99' }}>
              <TbWifiOff size={16} />
              <span>ออฟไลน์</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

// ── Grid (grouped by แขวง) ───────────────────────────────────────────────────

interface Props {
  data?: ListData[]
  isLoading?: boolean
  isError?: boolean
}

/** Grid view of the LPR overall list: a bureau divider ("N โครงการ") per
 *  sub-department followed by one card per install point. Grouped by the same
 *  `groupLPRList` the table uses, so both views agree on order and counts. */
const LPRList: React.FC<Props> = ({ data, isLoading, isError }) => {
  // const router = useRouter()
  // const deptId = String(useDeptId() ?? '0')

  const sections = useMemo(() => groupLPRSections(data), [data])

  // const goToDetail = useCallback(
  //   (item: SubDptSolution) => {
  //     router.push(`/admin/lpr/detail/${item.solution?.id}?dept_id=${deptId}&road_id=${item.road.id}${scopeQuerySuffix()}`)
  //   },
  //   [router, deptId],
  // )

  if (isError) return <Empty description="Error loading data" />
  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />

  if (sections.length === 0) {
    return <div className='py-12 text-center text-white/30 fs-12'>ไม่พบข้อมูล</div>
  }

  return (
    <div className='flex flex-col gap-6'>
      {sections.map((section) => (
        <section key={section.id} className='flex flex-col gap-3'>
          {/* Bureau header — matches the table's divider style */}
          <div
            className='flex items-center gap-3 px-4 py-2.5 rounded-lg'
            style={{ background: '#2a2a2a' }}
          >
            <span className='text-white font-bold'>{section.bureau}</span>
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full fs-12'
              style={{ border: '1px solid #fff', color: '#fff' }}
            >
              {section.count} โครงการ
            </span>
          </div>

          {/* Cards for this bureau */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {section.rows.map(({ id, item }) => (
              <LPRCard
                key={id}
                item={item}
              //  onDetail={() => goToDetail(item)} 
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default React.memo<Props>(LPRList)
