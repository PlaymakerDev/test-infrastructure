import { Col, Row } from 'antd'
import React from 'react'
import { CCTVSection, DataDisplaySection, InfoCardSection, LocationSection, MapSection } from '../components'

interface Props {

}

const OverallSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <LocationSection />
      </section>
      <section className='mt-5'>
        <DataDisplaySection />
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
