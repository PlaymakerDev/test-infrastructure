import React, { useMemo, useState } from 'react'
import { FormSearchControl, ControlStatCard, TableControlData, CCTVControlData } from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'

interface Props {}

const ControlSection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableControlData />
      case 'GRID':
        return <CCTVControlData />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <FormSearchControl />
      </section>
      <section className='mt-5'>
        <ControlStatCard />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการควบคุม VMS'
          onViewModeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ControlSection)
