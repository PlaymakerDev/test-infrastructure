"use client"
import { StatCardRow } from '@/components/section/StatCard'
import React, { useMemo } from 'react'
import { TbBuildingBridge2, TbShield } from 'react-icons/tb'
import { useTunnelTotals } from '@/hooks/queries/tunnel'
import { useDeptId } from '@/hooks/useDeptId'
import { fmtNumber } from '@/utils/formatNumber'

/** Right rail — 3 stat cards summarising the tunnel fleet.
 *  Data: `GET /tunnel/departments/{deptId}/overview/central/totals` */
const InfoCardSection: React.FC = () => {
  const deptId = useDeptId()
  const { data, isLoading } = useTunnelTotals(deptId)

  const cards = useMemo(() => {
    // Deeply optional — the placeholder backend may return `{}` or a partial
    // shape. `?.solution.total` would crash if `solution` itself is missing.
    const solutionTotal = data?.solution?.total ?? 0
    const solutionOnline = data?.solution?.online ?? 0
    const inWarranty = data?.warranty?.active ?? 0
    const expired = data?.warranty?.expired ?? 0
    // Warranty counts projects, not จุดติดตั้ง — use the warranty sum as
    // the denominator for ใน/หมดค้ำ percentages.
    const warrantyTotal = inWarranty + expired
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100)
    return [
      {
        icon: <TbBuildingBridge2 />,
        title: 'อุโมงค์ในระบบทั้งหมด',
        count: solutionTotal.toLocaleString(),
        activeLabel: `Active : ${fmtNumber(solutionOnline, 0)} (${fmtNumber(pct(solutionOnline, solutionTotal), 1)}%)`,
        color: 'yellow' as const,
        isLoading,
      },
      {
        icon: <TbShield />,
        title: 'ในค้ำ',
        count: inWarranty.toLocaleString(),
        activeLabel: `${fmtNumber(pct(inWarranty, warrantyTotal), 1)}%`,
        color: 'teal' as const,
        isLoading,
      },
      {
        icon: <TbShield />,
        title: 'หมดค้ำ',
        count: expired.toLocaleString(),
        activeLabel: `${fmtNumber(pct(expired, warrantyTotal), 1)}%`,
        color: 'gray' as const,
        isLoading,
      },
    ]
  }, [data, isLoading])

  return <StatCardRow cards={cards} />
}

export default React.memo(InfoCardSection)
