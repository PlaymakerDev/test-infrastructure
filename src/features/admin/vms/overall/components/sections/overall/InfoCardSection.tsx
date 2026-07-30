import { getVMSOverviewListAPI, getVMSOverviewTotalAPI } from '@/services/routes/VMSService'
import { useScopeAll } from '@/hooks/useScopeAll'
import { useDeptId } from '@/hooks/useDeptId'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { TbDeviceDesktop, TbShield } from 'react-icons/tb'

interface Props {
  roadId?: string | string[] | number
}

/** Right rail — 3 stat cards summarising the VMS fleet. Counts come from
 *  `/overview/central/totals`. Per-card "Active" lines (solutions with online
 *  VMS per warranty bucket) are derived from `/overview/central/list` — same
 *  cache the table consumes, no extra request. Pattern mirrors
 *  `InfoCardTrafficSignal.tsx`. */
const InfoCardSection: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  // Reactive ?scope=all — keys re-derive when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'

  const { data: totals, isLoading } = useQuery({
    queryKey: ['vms_total', String(deptId ?? ''), scope, String(roadId ?? '')],
    queryFn: () => getVMSOverviewTotalAPI(Number(deptId)!, roadId ? { road_id: roadId } : {}),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  // Match the base params DataDisplaySection uses (`{ page:1, limit:10 }`) so
  // this query hits the same cache entry TanStack already populated for the
  // table below — no extra request.
  const { data: list } = useQuery({
    queryKey: ['vms_list', String(deptId ?? ''), scope, String(roadId ?? ''), { page: 1, limit: 10 }],
    queryFn: () => getVMSOverviewListAPI(Number(deptId)!, roadId ? { road_id: roadId, page: 1, limit: 10 } : { page: 1, limit: 10 }),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })

  const stats = useMemo(() => {
    const total = totals?.data.solution.total ?? 0
    const online = totals?.data.solution.online ?? 0
    const inWarranty = totals?.data.warranty.active ?? 0
    const expired = totals?.data.warranty.expired ?? 0
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)

    // Count solutions with online VMS, split by warranty bucket.
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const dept of list?.data ?? []) {
      for (const sub of dept.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          if (sol.vms.status.is_online) {
            if (sol.warranty.is_warranty) inWarrantyActive++
            else expiredActive++
          }
        }
      }
    }

    return {
      total,
      online,
      totalPct: pct(online, total),
      inWarranty,
      inWarrantyActive,
      inWarrantyPct: pct(inWarrantyActive, inWarranty),
      expired,
      expiredActive,
      expiredPct: pct(expiredActive, expired),
    }
  }, [totals, list])

  const dim = isLoading ? 'opacity-50' : ''

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#FFB1001A] border-2 rounded-2xl p-5 border-(--yellow) ${dim}`}>
          <TbDeviceDesktop className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>ป้าย VMS ในระบบทั้งหมด</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.total.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.online, 0)} ({fmtNumber(stats.totalPct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#05F2DB1A] border-2 rounded-2xl p-5 border-teal-500 ${dim}`}>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.inWarrantyActive, 0)} ({fmtNumber(stats.inWarrantyPct, 1)}%)
          </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className={`h-full bg-[#9797971A] border-2 rounded-2xl p-5 border-gray-500 ${dim}`}>
          <TbShield className='fs-24 text-gray-500 mb-1' />
          <h3 className='text-gray-500'>หมดค้ำ</h3>
          <p>
            <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> จุดติดตั้ง
          </p>
          <p className='fs-12 text-gray-400'>
            Active : {fmtNumber(stats.expiredActive, 0)} ({fmtNumber(stats.expiredPct, 1)}%)
          </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
