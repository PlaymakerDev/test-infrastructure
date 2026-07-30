"use client"
import { StatCardRow } from '@/components/section/StatCard'
import React, { useMemo } from 'react'
import { TbShield, TbWalk } from 'react-icons/tb'
import { useCrosswalkCentralList, useCrosswalkTotals } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  roadId: string | null
}

/** Right rail — 3 stat cards summarising the crosswalk fleet. Counts come
 *  from `/overview/central/totals`. Per-card "Active" lines (solutions with
 *  online crosswalk device per warranty bucket) are derived from
 *  `/overview/central/list` — same cache the table consumes, no extra
 *  request. Pattern mirrors `InfoCardTrafficSignal.tsx`. */
const InfoCardSection: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  const { data, isLoading } = useCrosswalkTotals(deptId, roadId ? { road_id: roadId } : {})
  const { data: central } = useCrosswalkCentralList(deptId, roadId ? { road_id: roadId, page: 1, limit: 100 } : { page: 1, limit: 100 })

  const cards = useMemo(() => {
    const solutionTotal = data?.solution.total ?? 0
    const solutionOnline = data?.solution.online ?? 0
    const inWarranty = data?.warranty.active ?? 0
    const expired = data?.warranty.expired ?? 0
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)

    // Count solutions with online crosswalk devices, split by warranty bucket.
    let inWarrantyActive = 0
    let expiredActive = 0
    for (const bureau of central ?? []) {
      for (const sub of bureau.sub_department ?? []) {
        for (const sol of sub.solutions ?? []) {
          if (sol.crosswalk.is_online) {
            if (sol.is_warranty) inWarrantyActive++
            else expiredActive++
          }
        }
      }
    }

    return [
      {
        icon: <TbWalk />,
        title: 'ทางข้ามในระบบทั้งหมด',
        count: solutionTotal.toLocaleString(),
        activeLabel: `Active : ${fmtNumber(solutionOnline, 0)} (${fmtNumber(pct(solutionOnline, solutionTotal), 1)}%)`,
        color: 'yellow' as const,
        isLoading,
      },
      {
        icon: <TbShield />,
        title: 'ในค้ำ',
        count: inWarranty.toLocaleString(),
        activeLabel: `Active : ${fmtNumber(inWarrantyActive, 0)} (${fmtNumber(pct(inWarrantyActive, inWarranty), 1)}%)`,
        color: 'teal' as const,
        isLoading,
      },
      {
        icon: <TbShield />,
        title: 'หมดค้ำ',
        count: expired.toLocaleString(),
        activeLabel: `Active : ${fmtNumber(expiredActive, 0)} (${fmtNumber(pct(expiredActive, expired), 1)}%)`,
        color: 'gray' as const,
        isLoading,
      },
    ]
  }, [data, central, isLoading])

  return <StatCardRow cards={cards} />
}

export default React.memo(InfoCardSection)
