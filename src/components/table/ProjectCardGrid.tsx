"use client"
import React from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  TbGridDots,
  TbWifi,
  TbWifiOff,
  TbInfoSquareRoundedFilled,
} from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { getDepartmentByRoadAPI } from '@/services/routes/SharedService'

/** One project/solution card in the overall GRID view. Shared by
 *  traffic-signal / incident-detection / traffic-volume so the card layout is
 *  identical to cctv's overall grid (CardGridCctv). */
export interface ProjectCardItem {
  /** Stable react key (usually the solution id). */
  key: string
  /** Road id — drives the "หน่วยงานที่รับผิดชอบ" lookup + Project Info modal. */
  roadId: number
  /** Project id — opens the Project Info modal. */
  projectId?: number | string | null
  roadCode: string
  projectName: string
  installPoint: string
  contractNo?: string | null
  budgetYear?: string | number | null
  isWarranty: boolean
  bureau: string
  total: number
  online: number
  offline: number
  /** Navigate to the project's detail page (caller owns the route). */
  onDetail: () => void
}

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-1 rounded-full text-sm whitespace-nowrap'
    style={{ border: `1.5px solid ${color}`, color }}
  >
    {text}
  </span>
)

const ProjectCard: React.FC<{
  item: ProjectCardItem
  departmentName?: string
  totalLabel: string
}> = ({ item, departmentName, totalLabel }) => {
  const dispatch = useAppDispatch()
  const warrantyColor = item.isWarranty ? '#05F2DB' : '#979797'
  const warrantyText = item.isWarranty ? 'ในค้ำ' : 'หมดค้ำ'
  // No contract → show the budget year (พ.ศ.) and disable the project ⓘ.
  const hasContract = !!(item.contractNo && item.contractNo.trim())
  const contractText = hasContract
    ? item.contractNo
    : item.budgetYear
      ? `ปีงบประมาณ ${item.budgetYear}`
      : '-'

  return (
    <div
      className='flex flex-col gap-4 rounded-2xl p-5'
      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
    >
      {/* Title — project name (ชื่อโครงการ), clamped to keep card heights even. */}
      <h4
        className='text-base font-semibold leading-snug mb-0 line-clamp-2 wrap-break-word'
        style={{ color: 'var(--yellow)' }}
        title={item.projectName}
      >
        {item.projectName}
      </h4>

      {/* Badges row */}
      <div className='flex flex-wrap items-center gap-2'>
        <Pill text={item.roadCode} color='#66AEFF' />
        <Pill text={warrantyText} color={warrantyColor} />
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
                      project_id: item.projectId ?? null,
                      road_id: item.roadId ?? null,
                    })
                  )
              : undefined
          }
        />
      </div>

      {/* Info rows */}
      <div className='flex flex-col gap-1.5 text-sm'>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>จุดติดตั้ง :</span>
          <span
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={item.onDetail}
            role='link'
            tabIndex={0}
          >
            {item.installPoint}
          </span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>เลขที่สัญญา :</span>
          <span className='text-white'>{contractText}</span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>หน่วยงานที่รับผิดชอบ :</span>
          <span className='text-white'>{departmentName ?? '-'}</span>
        </div>
      </div>

      {/* Stats — total / online / offline (same layout as cctv). */}
      <div className='flex items-center justify-around pt-2'>
        <div className='flex flex-col items-center gap-2'>
          <span className='fs-24 font-bold tabular-nums leading-none text-white'>{item.total}</span>
          <div className='flex items-center gap-1 text-sm text-white/50'>
            <TbGridDots size={16} />
            <span>{totalLabel}</span>
          </div>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.online === 0 ? '#66AEFF55' : '#66AEFF' }}
          >
            {item.online}
          </span>
          <div className='flex items-center gap-1 text-sm' style={{ color: '#66AEFF99' }}>
            <TbWifi size={16} />
            <span>ออนไลน์</span>
          </div>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.offline === 0 ? '#E94C4C55' : '#E94C4C' }}
          >
            {item.offline}
          </span>
          <div className='flex items-center gap-1 text-sm' style={{ color: '#E94C4C99' }}>
            <TbWifiOff size={16} />
            <span>ออฟไลน์</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  items: ProjectCardItem[]
  /** Label for the "total" stat (default "ทั้งหมด"); e.g. "อุปกรณ์ทั้งหมด". */
  totalLabel?: string
}

/** Overall GRID view — project cards grouped by แขวง (mirrors the table's
 *  bureau dividers + cctv's CardGridCctv layout). */
const ProjectCardGrid: React.FC<Props> = ({ items, totalLabel = 'ทั้งหมด' }) => {
  const groups = React.useMemo(() => {
    const map = new Map<string, ProjectCardItem[]>()
    for (const it of items) {
      const list = map.get(it.bureau) ?? []
      list.push(it)
      map.set(it.bureau, list)
    }
    return Array.from(map.entries())
  }, [items])

  // "หน่วยงานที่รับผิดชอบ" comes from /manage/departments/by-road (same source
  // as the Project Info modal). Fetch once per DISTINCT road, cached forever.
  const roadIds = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.roadId).filter(Boolean))),
    [items]
  )
  const deptQueries = useQueries({
    queries: roadIds.map((roadId) => ({
      queryKey: ['department_by_road', roadId],
      queryFn: () => getDepartmentByRoadAPI({ road_id: roadId }).then((r) => r.data.department_name),
      enabled: !!roadId,
      staleTime: Infinity,
    })),
  })
  const deptByRoad = React.useMemo(() => {
    const map = new Map<number, string>()
    roadIds.forEach((roadId, i) => {
      const name = deptQueries[i]?.data
      if (name) map.set(roadId, name)
    })
    return map
  }, [roadIds, deptQueries])

  if (items.length === 0) {
    return <div className='py-12 text-center text-white/30 text-sm'>ไม่พบข้อมูล</div>
  }

  return (
    <div className='flex flex-col gap-6'>
      {groups.map(([bureau, rows]) => (
        <section key={bureau} className='flex flex-col gap-3'>
          <div
            className='flex items-center gap-3 px-4 py-2.5 rounded-lg'
            style={{ background: '#2a2a2a' }}
          >
            <span className='text-white font-bold'>{bureau}</span>
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
              style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
            >
              {rows.length} โครงการ
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {rows.map((item) => (
              <ProjectCard
                key={item.key}
                item={item}
                departmentName={deptByRoad.get(item.roadId)}
                totalLabel={totalLabel}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default React.memo<Props>(ProjectCardGrid)
