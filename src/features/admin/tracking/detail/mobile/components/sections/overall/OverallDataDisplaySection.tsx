import React, { useMemo, useState } from 'react'
import {
  TableMobileDailyWeight,
  MobileDailyWeightList
} from '@/features/admin/tracking/detail/mobile/components'
import SearchBar from '@/components/searchable/SearchBar'

interface Props {

}

const OverallDataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<'TABLE' | 'GRID'>('TABLE')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableMobileDailyWeight />
      case 'GRID':
        return <MobileDailyWeightList />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <h3 className='text-yellow-500'>ตารางข้อมูลรถเข้าชั่งประจำวัน</h3>
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
