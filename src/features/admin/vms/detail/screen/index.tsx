import React, { useMemo, useState } from 'react'
import { TitleSection, OverallSection, ControlSection } from '../components'
import { DetailProvider } from '../context'

interface Props {
  id?: string | string[]
}

const VMSDetailScreen: React.FC<Props> = (props) => {
  const { } = props
  const [currentTab, setCurrentTab] = useState('OVERALL')

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'OVERALL': return <OverallSection />
      case 'CONTROL': return <ControlSection />
      default: return <OverallSection />
    }
  }, [currentTab])

  return (
    <DetailProvider>
      <div className='main-screen'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8 px-10'>
          {renderContent}
        </section>
      </div>
    </DetailProvider>
  )
}

export default React.memo<Props>(VMSDetailScreen)
