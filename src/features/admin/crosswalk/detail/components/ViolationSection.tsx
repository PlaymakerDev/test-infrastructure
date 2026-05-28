import React, { useMemo, useState } from 'react'
import {
  FormSearchViolation,
  ViolationStatCard,
  TableViolationData,
  CCTVViolationData
} from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'

interface Props {

}

const ViolationSection: React.FC<Props> = (props) => {
  const { } = props
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableViolationData />
      case 'GRID':
        return <CCTVViolationData />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        <FormSearchViolation />
      </section>
      <section className='mt-5'>
        <ViolationStatCard />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม'
          onViewModeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
