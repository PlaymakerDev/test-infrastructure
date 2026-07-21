import React, { useMemo, useState } from 'react'
import { TableOverallDailyWeight, OverallDailyWeightList } from '@/features/admin/tracking/detail/wim/components'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { WEIGHT_FILTERS, IS_OVER_WEIGHT_BY_FILTER, WeightFilter } from '@/features/admin/tracking/detail/wim/data/weightFilters'
import SearchBar, { FilterStats } from '@/components/searchable/SearchBar'
import { fmtNumber } from '@/utils/formatNumber';

interface Props {

}

const OverallDataDisplaySection: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')
  const [weightFilter, setWeightFilter] = useState<WeightFilter>('all')

  // Unfiltered (page_size 1) read, purely for meta.summary — the 3 filter badges
  // must always show all/normal/overweight counts together, regardless of which
  // tab is currently selected, so this is independent of `weightFilter`.
  const { meta: statsMeta } = useDailyWeightLogList(stationId as string | number | undefined, stationType, 1, 1)
  const summary = statsMeta?.summary

  const stats: FilterStats = useMemo(() => ({
    all: fmtNumber(Number(summary?.total)),
    normal: summary ? fmtNumber(Number(summary.total) - Number(summary.overweight)) : undefined,
    overweight: fmtNumber(Number(summary?.overweight)),
  }), [summary])

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return (
          <TableOverallDailyWeight
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
          />
        )
      case 'GRID':
        return (
          <OverallDailyWeightList
            stationId={stationId}
            stationType={stationType}
            isOverWeight={IS_OVER_WEIGHT_BY_FILTER[weightFilter]}
          />
        )
      default:
        return null
    }
  }, [displayType, stationId, stationType, weightFilter])

  return (
    <div>
      <section>
        <h3 className='text-(--yellow) font-normal!'>ตารางข้อมูลรถเข้าชั่งน้ำหนักวันนี้</h3>
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
