"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { TbBolt, TbCamera } from 'react-icons/tb'

dayjs.extend(relativeTime)
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'

interface Props {
  deptId?: string | string[] | number
}

/** Left-panel companion to the map — a ranked mini-list of the busiest LPR
 *  install-points today. Same data source as the map + KPIs, filtered to the
 *  current dept, top 5 by events_today. Each row clicks through to the
 *  point's detail page (matches the map marker click). */
const CCTVSection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const { data: points, isLoading } = useLPRPoints()

  const top = useMemo(() => {
    const all = points ?? []
    return (!deptId || deptId === '0'
      ? all
      : all.filter((p) => p.department_id === Number(deptId))
    )
      .slice()
      .sort((a, b) => b.events_today - a.events_today)
      .slice(0, 5)
  }, [points, deptId])

  return (
    <div className='h-full flex flex-col gap-3'>
      <div className='flex items-center justify-between px-1'>
        <h4 className='text-white'>จุดตรวจจับสูงสุดวันนี้</h4>
        <span className='fs-12 text-gray-500'>Top 5</span>
      </div>

      {isLoading && (
        <div className='py-6 text-center text-gray-400 fs-12'>กำลังโหลด…</div>
      )}
      {!isLoading && top.length === 0 && (
        <div className='py-6 text-center text-gray-500 fs-12'>ไม่มีข้อมูล</div>
      )}

      <div className='flex flex-col gap-2'>
        {top.map((p, i) => (
          <div
            key={p.solution_id}
            role='button'
            tabIndex={0}
            onClick={() =>
              router.push(
                `/admin/lpr/detail/${p.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(
                  `/admin/lpr/detail/${p.solution_id}?dept_id=${deptId}${scopeQuerySuffix()}`,
                )
              }
            }}
            className='cursor-pointer bg-(--mid-gray) hover:bg-(--light-black) transition-colors rounded-xl p-3 flex flex-col gap-1'
          >
            <div className='flex items-center gap-2'>
              <span className='shrink-0 w-6 h-6 rounded-full bg-(--yellow)/20 text-(--yellow) flex items-center justify-center fs-12 font-bold'>
                {i + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='fs-12 text-(--default-blue) font-semibold tabular-nums truncate'>
                  {p.road_code || '-'}
                </div>
                <div className='fs-13 text-white truncate'>
                  {p.solution_name}
                </div>
              </div>
            </div>
            <div className='flex items-center justify-between pl-8'>
              <div className='flex items-center gap-1 text-white/70'>
                <TbCamera size={12} />
                <span className='fs-12'>{p.camera_count} กล้อง</span>
              </div>
              <div className='flex items-center gap-1 text-(--yellow)'>
                <TbBolt size={12} />
                <span className='fs-12 font-bold tabular-nums'>
                  {p.events_today.toLocaleString('th-TH')}
                </span>
              </div>
            </div>
            <p className='pl-8 fs-12 text-gray-500'>
              ล่าสุด {p.latest_captured_at ? dayjs(p.latest_captured_at).locale('th').fromNow() : '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
