"use client"
import React, { useMemo } from 'react'
import { TbShield, TbTrafficLights } from 'react-icons/tb'
import { useTrafficCentralList, useTrafficTotals } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

interface Props { }

/** Right rail — 3 stat cards summarising the traffic-signal fleet. Counts come
 *  from `/overview/totals`. Per-card "Active" lines (solutions with online
 *  controllers per warranty bucket) are derived from `/overview/central/list`
 *  — same cache the table consumes, no extra request. */
const InfoCardTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data: totals, isLoading } = useTrafficTotals(deptId)
  const { data: central } = useTrafficCentralList(deptId)

  const stats = useMemo(() => {
    const total = totals?.solution.total ?? 0
    const online = totals?.solution.online ?? 0
    const inWarranty = totals?.warranty.active ?? 0
    const expired = totals?.warranty.expired ?? 0
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)

    // Count solutions with online controllers, split by warranty bucket.
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const bureau of central ?? []) {
      for (const sub of bureau.sub_department) {
        for (const sol of sub.solutions) {
          if (sol.traffic.is_online) {
            if (sol.is_warranty) inWarrantyActive++
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
  }, [totals, central])

  // While loading, dim slightly so the layout doesn't jump.
  const dim = isLoading ? 'opacity-50' : ''
  // `min-h-40` floors every card to card 1's natural size — keeps all three
  // visually identical even though cards 2 & 3 have fewer text lines.
  const cardClass = `min-h-40 border-2 rounded-2xl p-5 ${dim}`

  return (
    <div className='flex flex-col gap-4 md:grid md:grid-cols-3 lg:flex lg:flex-col'>
      <div className={`${cardClass} bg-[#FFB1001A] border-(--yellow)`}>
        <TbTrafficLights className='fs-24 text-(--yellow) mb-1' />
        <h3 className='text-(--yellow)'>แยกจราจรในระบบทั้งหมด</h3>
        <p>
          <span className='fs-24 font-bold'>{stats.total.toLocaleString()}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(stats.online, 0)} ({fmtNumber(stats.totalPct, 1)}%)
        </p>
      </div>
      <div className={`${cardClass} bg-[#05F2DB1A] border-teal-500`}>
        <TbShield className='fs-24 text-teal-500 mb-1' />
        <h3 className='text-teal-500'>ในค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{stats.inWarranty.toLocaleString()}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(stats.inWarrantyActive, 0)} ({fmtNumber(stats.inWarrantyPct, 1)}%)
        </p>
      </div>
      <div className={`${cardClass} bg-[#9797971A] border-gray-500`}>
        <TbShield className='fs-24 text-gray-400 mb-1' />
        <h3 className='text-gray-400'>หมดค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{stats.expired.toLocaleString()}</span> จุดติดตั้ง
        </p>
        <p className='fs-11 text-gray-400'>
          Active : {fmtNumber(stats.expiredActive, 0)} ({fmtNumber(stats.expiredPct, 1)}%)
        </p>
      </div>
    </div>
  )
}

export default React.memo<Props>(InfoCardTrafficSignal)
