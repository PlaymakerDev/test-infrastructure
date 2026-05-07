import React, { useMemo, useState } from 'react'
import { TableOverallDailyWeight, OverallDailyWeightList } from '@/features/admin/tracking/detail/wim/components'
import SearchBar from '@/components/searchable/SearchBar'

interface Props {

}

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableOverallDailyWeight />
      case 'GRID':
        return <OverallDailyWeightList />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <h3 className='text-yellow-500'>ตารางข้อมูลรถเข้าชั่งน้ำหนักวันนี้</h3>
      </section>
      <section className='mt-5'>
        <SearchBar
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
