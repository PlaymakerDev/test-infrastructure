"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Empty, Row, Col } from 'antd'
import dayjs from 'dayjs'
import { TbCamera, TbBolt } from 'react-icons/tb'
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDeptId } from '@/hooks/useDeptId'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'

/** Grid view of LPR install-points — card per solution. Denser info than the
 *  table row (KPIs stacked + camera preview) for at-a-glance scanning. */
const LPRList: React.FC = () => {
  const router = useRouter()
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdFromUrl ?? '0')
  const { data: points, isLoading } = useLPRPoints()

  const list = useMemo(() => {
    const all = points ?? []
    return (!deptId || deptId === '0'
      ? all
      : all.filter((p) => p.department_id === Number(deptId))
    ).slice().sort((a, b) => b.events_today - a.events_today)
  }, [points, deptId])

  if (isLoading) {
    return <div className='py-10 text-center text-gray-400'>กำลังโหลด…</div>
  }
  if (list.length === 0) {
    return <Empty description='ไม่พบจุดติดตั้ง LPR' />
  }

  return (
    <Row gutter={[16, 16]}>
      {list.map((p) => (
        <Col key={p.solution_id} xs={24} sm={12} lg={8} xxl={6}>
          <div
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
            className='cursor-pointer h-full bg-(--mid-gray) hover:bg-(--light-black) border border-white/5 rounded-2xl p-4 flex flex-col gap-2 transition-colors'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='fs-11 text-(--default-blue) font-semibold tabular-nums'>
                {p.road_code || '-'}
              </span>
              {p.events_hour > 0 ? (
                <span className='fs-11 text-(--yellow) font-medium'>
                  ● Active
                </span>
              ) : (
                <span className='fs-11 text-gray-500'>● Idle</span>
              )}
            </div>
            <h4 className='text-white leading-snug truncate'>
              {p.solution_name}
            </h4>
            <p className='fs-11 text-gray-400 line-clamp-2'>
              {p.project_name || '-'}
            </p>
            <div className='mt-auto flex items-center justify-between pt-2 border-t border-white/5'>
              <div className='flex items-center gap-1.5 text-white/70'>
                <TbCamera size={14} />
                <span className='fs-11'>
                  {p.camera_count.toLocaleString('th-TH')} กล้อง
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-(--yellow)'>
                <TbBolt size={14} />
                <span className='fs-13 font-bold tabular-nums'>
                  {p.events_today.toLocaleString('th-TH')}
                </span>
                <span className='fs-11 text-gray-400'>วันนี้</span>
              </div>
            </div>
            <p className='fs-11 text-gray-500'>
              ล่าสุด {p.latest_captured_at ? dayjs(p.latest_captured_at).fromNow() : '-'}
            </p>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo(LPRList)
