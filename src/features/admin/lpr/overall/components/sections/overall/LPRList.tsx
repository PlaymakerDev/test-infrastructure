"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import {
  TbCamera,
  TbLicense,
  TbBolt,
  TbInfoSquareRoundedFilled,
} from 'react-icons/tb'

dayjs.extend(relativeTime)
import { SHOW_PROJECT_NAME } from '@/constants/featureFlags'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { LPRInstallPoint } from '@/types/lpr/lpr-api'

const Pill: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    className='inline-flex items-center px-3 py-1 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1.5px solid ${color}`, color }}
  >
    {text}
  </span>
)

/** One LPR install-point card — same visual language as the shared
 *  `ProjectCardGrid` card (cctv / incident-detection / traffic-signal /
 *  traffic-volume): yellow project title, road-code pill, ⓘ Project-Info
 *  icon, จุดติดตั้ง link row, big fs-24 stat row. The stat trio is
 *  LPR-specific (กล้อง / ตรวจจับวันนี้ / ชั่วโมงล่าสุด) since LPR points
 *  carry detection counts, not online/offline camera status. */
const LPRCard: React.FC<{ point: LPRInstallPoint; onDetail: () => void }> = ({
  point: p,
  onDetail,
}) => {
  const dispatch = useAppDispatch()
  const hasContract = !!(p.contract_no && p.contract_no.trim())

  return (
    <div
      className='flex flex-col gap-4 rounded-2xl p-5'
      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
    >
      {/* Title — project name, clamped to keep card heights even. */}
      {SHOW_PROJECT_NAME && (
        <h4
          className='text-base font-semibold leading-snug mb-0 line-clamp-2 wrap-break-word'
          style={{ color: 'var(--yellow)' }}
          title={p.project_name}
        >
          {p.project_name || '-'}
        </h4>
      )}

      {/* Badges row */}
      <div className='flex flex-wrap items-center gap-2'>
        <Pill text={p.road_code || '-'} color='#66AEFF' />
        {/* Status pill — same wording + colours as the filter chips and every
          * other overall menu (blue ออนไลน์ / red ออฟไลน์), keyed off
          * events_hour since /lpr/points has no is_online (2026-08-10). */}
        {p.events_hour > 0 ? (
          <Pill text='ออนไลน์' color='#66AEFF' />
        ) : (
          <Pill text='ออฟไลน์' color='#E94C4C' />
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
                    project_id: p.project_id ?? null,
                    road_id: p.road_id ?? null,
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
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={onDetail}
            role='link'
            tabIndex={0}
          >
            {p.solution_name}
          </span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>เลขที่สัญญา :</span>
          <span className='text-white'>{hasContract ? p.contract_no : '-'}</span>
        </div>
        <div className='flex gap-2'>
          <span className='text-white/50 whitespace-nowrap shrink-0'>ตรวจจับล่าสุด :</span>
          <span className='text-white'>
            {p.latest_captured_at
              ? dayjs(p.latest_captured_at).locale('th').fromNow()
              : '-'}
          </span>
        </div>
      </div>

      {/* Stats — กล้อง / ตรวจจับวันนี้ / ชั่วโมงล่าสุด (same layout as ProjectCard). */}
      <div className='mt-auto flex items-center justify-around pt-2'>
        <div className='flex flex-col items-center gap-2'>
          <span className='fs-24 font-bold tabular-nums leading-none text-white'>
            {p.camera_count.toLocaleString('th-TH')}
          </span>
          <div className='flex items-center gap-1 fs-12 text-white/50'>
            <TbCamera size={16} />
            <span>กล้อง</span>
          </div>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: p.events_today === 0 ? '#FCD11655' : '#FCD116' }}
          >
            {p.events_today.toLocaleString('th-TH')}
          </span>
          <div className='flex items-center gap-1 fs-12' style={{ color: '#FCD11699' }}>
            <TbLicense size={16} />
            <span>วันนี้</span>
          </div>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <span
            className='fs-24 font-bold tabular-nums leading-none'
            style={{ color: p.events_hour === 0 ? '#66AEFF55' : '#66AEFF' }}
          >
            {p.events_hour.toLocaleString('th-TH')}
          </span>
          <div className='flex items-center gap-1 fs-12' style={{ color: '#66AEFF99' }}>
            <TbBolt size={16} />
            <span>ชม.ล่าสุด</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  /** Filtered rows from DataDisplaySection (already dept-scoped). */
  points: LPRInstallPoint[]
}

/** Grid view of LPR install-points — card per solution, sorted busiest-first.
 *  Same responsive column set as `ProjectCardGrid`. */
const LPRList: React.FC<Props> = ({ points }) => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdFromUrl ?? '0')

  const list = useMemo(
    () => points.slice().sort((a, b) => b.events_today - a.events_today),
    [points],
  )

  if (list.length === 0) {
    return <div className='py-12 text-center text-white/30 fs-12'>ไม่พบข้อมูล</div>
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {list.map((p) => (
        <LPRCard
          key={p.solution_id}
          point={p}
          onDetail={() =>
            router.push(
              `/admin/lpr/detail/${p.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
            )
          }
        />
      ))}
    </div>
  )
}

export default React.memo(LPRList)
