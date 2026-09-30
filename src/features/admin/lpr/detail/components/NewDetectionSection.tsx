import React, { useMemo, useState } from 'react'
import { FormSearchDetection, GridDetectionData, TableDetectionData } from '../components'

interface Props {

}

const NewDetectionSection: React.FC<Props> = (props) => {
  const { } = props
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE')

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return <TableDetectionData />
      case 'GRID':
        return <GridDetectionData />
      default:
        return null
    }
  }, [viewMode])

  return (
    <div>
      <h3 className='text-(--yellow) font-normal!'>ตารางตรวจจับป้ายทะเบียน</h3>
      <section className='mt-5'>
        <FormSearchDetection
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(NewDetectionSection)
