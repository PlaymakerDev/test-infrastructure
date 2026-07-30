"use client"
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import type { CCTVOverviewListItem, CCTVOverviewRow } from '@/types/cctv/overview-api'
import { Tooltip } from 'antd'

// ── Pill badge ───────────────────────────────────────────────────────────────

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-1 rounded-full text-sm whitespace-nowrap'
    style={{ border: `1.5px solid ${color}`, color }}
  >
    {text}
  </span>
)

// ── Single camera card ────────────────────────────────────────────────────────

const CctvCard: React.FC<{ item: CCTVOverviewListItem; departmentName?: string }> = ({
  item,
  departmentName,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const warrantyColor = item.is_warranty ? '#05F2DB' : '#979797'
  const warrantyText = item.is_warranty ? 'ในค้ำ' : 'หมดค้ำ'
  // No contract → show the budget year (พ.ศ.) and disable the project ⓘ.
  const hasContract = !!(item.project.contract_no && item.project.contract_no.trim())
  const contractText = hasContract
    ? item.project.contract_no
    : item.project.budget_year
      ? `ปีงบประมาณ ${item.project.budget_year}`
      : '-'

  const goToDetail = () => {
    const deptId = searchParams.get('dept_id')
    router.push(`/admin/cctv/detail/${item.solution.id}${deptId ? `?dept_id=${deptId}${scopeQuerySuffix()}` : ''}`)
  }

  return (
    <div
      className='flex flex-col gap-4 rounded-2xl p-5'
      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
    >
      {/* Title — project name (ชื่อโครงการ). Clamped so long names don't make
        * cards wildly different heights; full text on hover. */}
      {/* {SHOW_PROJECT_NAME && (
        <h4
          className='text-base font-semibold leading-snug mb-0 line-clamp-2 wrap-break-word'
          style={{ color: 'var(--yellow)' }}
          title={item.project.project_name}
        >
          {item.project.project_name}
        </h4>
      )} */}
      <Tooltip
        title={item.project.project_name}
      >
        <h4
          className='font-normal! text-(--yellow) leading-snug mb-0 line-clamp-2 wrap-break-word'
        >
          {item.project.project_name}
        </h4>
      </Tooltip>

      {/* Badges row */}
      <div className='flex flex-wrap items-center gap-2'>
        <Pill text={item.road.code_name} color='#66AEFF' />
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
                    project_id: item.project.id,
                    road_id: item.road.id,
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
            onClick={goToDetail}
            role='link'
            tabIndex={0}
          >
            {item.solution.solution_name}
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

      {/* Stats */}
      <div className='flex items-center justify-around pt-2'>

        {/* ทั้งหมด */}
        <div className='flex flex-col items-center gap-2'>
          <span className='fs-24 font-bold tabular-nums leading-none text-white'>
            {item.camera.total}
          </span>
          <div className='flex items-center gap-1 text-sm text-white/50'>
            <TbGridDots size={16} />
            <span>ทั้งหมด</span>
          </div>
        </div>

        {/* ออนไลน์ */}
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.camera.online === 0 ? '#66AEFF55' : '#66AEFF' }}
          >
            {item.camera.online}
          </span>
          <div className='flex items-center gap-1 text-sm' style={{ color: '#66AEFF99' }}>
            <TbWifi size={16} />
            <span>ออนไลน์</span>
          </div>
        </div>

        {/* ออฟไลน์ */}
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: item.camera.offline === 0 ? '#E94C4C55' : '#E94C4C' }}
          >
            {item.camera.offline}
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

// ── Grid (grouped by แขวง) ──────────────────────────────────────────────────────

interface Props {
  items: CCTVOverviewRow[]
}

const CardGridCctv: React.FC<Props> = ({ items }) => {
  // Group cards by bureau (แขวง) so the grid mirrors the table's grouping.
  const groups = React.useMemo(() => {
    const map = new Map<string, CCTVOverviewRow[]>()
    for (const it of items) {
      const list = map.get(it.bureau) ?? []
      list.push(it)
      map.set(it.bureau, list)
    }
    return Array.from(map.entries())
  }, [items])

  // "หน่วยงานที่รับผิดชอบ" comes from the same source as the Project Info modal
  // (/manage/departments/by-road) — it isn't on the overview list. Fetch once
  // per DISTINCT road (deduped, cached forever since it's static reference
  // data). This component only mounts in card view, so the calls stay lazy.
  const roadIds = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.road.id))),
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
    return (
      <div className='py-12 text-center text-white/30 text-sm'>ไม่พบข้อมูล</div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      {groups.map(([bureau, rows]) => (
        <section key={bureau} className='flex flex-col gap-3'>
          {/* Bureau header — matches the table's divider style */}
          <div
            className='flex items-center gap-3 px-4 py-2.5 rounded-lg'
            style={{ background: '#2a2a2a' }}
          >
            <span className='text-white font-bold'>{bureau}</span>
            <span
              className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
              style={{ border: '1px solid #fff', color: '#fff' }}
            >
              {rows.length} โครงการ
            </span>
          </div>

          {/* Cards for this bureau */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {rows.map((item) => (
              <CctvCard
                key={item.solution.id}
                item={item}
                departmentName={deptByRoad.get(item.road.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default React.memo<Props>(CardGridCctv)
