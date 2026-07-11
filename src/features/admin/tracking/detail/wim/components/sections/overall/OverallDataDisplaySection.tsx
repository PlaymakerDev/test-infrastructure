import React, { useMemo, useState } from 'react'
import { TableOverallDailyWeight, OverallDailyWeightList } from '@/features/admin/tracking/detail/wim/components'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import SearchBar, { FilterConfig, FilterStats } from '@/components/searchable/SearchBar'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
}

type WeightFilter = 'all' | 'normal' | 'overweight'

const WEIGHT_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#3b82f6',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-blue-800 text-white',
    badgeIdleClass: 'bg-blue-500/20 text-blue-400',
  },
  {
    key: 'normal',
    label: 'น้ำหนักปกติ',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'overweight',
    label: 'น้ำหนักเกิน',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

// 'all' omits `is_over_weight` entirely (BaseService/axios drops undefined params).
const IS_OVER_WEIGHT_BY_FILTER: Record<WeightFilter, 'Y' | 'N' | undefined> = {
  all: undefined,
  normal: 'N',
  overweight: 'Y',
}

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { stationId, stationType } = props
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')

  // Unfiltered (page_size 1) read, purely for meta.summary — the 3 filter badges
  // must always show all/normal/overweight counts together, regardless of which
  // tab is currently selected, so this is independent of `weightFilter`.
  const { meta: statsMeta } = useDailyWeightLogList(stationId as string | number | undefined, stationType, 1, 1)
  const summary = statsMeta?.summary

  const stats: FilterStats = useMemo(() => ({
    all: summary?.total,
    normal: summary ? summary.total - summary.overweight : undefined,
    overweight: summary?.overweight,
  }), [summary])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return (
          <TableOverallDailyWeight
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
          />
        )
      case 'GRID':
        return <OverallDailyWeightList />
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow)'>ตารางข้อมูลรถเข้าชั่งน้ำหนักวันนี้</h3>
      </section>
      <section className='mt-5'>
        <SearchBar
          filters={WEIGHT_FILTERS}
          stats={stats}
          activeFilter={weightFilter}
          onFilterChange={(key) => setWeightFilter(key as WeightFilter)}
          defaultViewMode={displayType}
          onViewModeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
