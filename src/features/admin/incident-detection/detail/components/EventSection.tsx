import React, { useMemo, useState } from 'react'
import { FormSearchEvent, EventStatCard, TableEventData, CCTVEventData } from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'

interface Props {}

const EventSection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE': return <TableEventData />
      case 'GRID': return <CCTVEventData />
      default: return null
    }
  }, [displayType])

  return (
    <div>
      <section><FormSearchEvent /></section>
      <section className='mt-5'><EventStatCard /></section>
      <section className='mt-5'>
        <SearchBar mode='title' title='ตารางข้อมูลเหตุการณ์ที่ตรวจพบ' onViewModeChange={setDisplayType} />
      </section>
      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(EventSection)
