import React from 'react'
import { ChartLicenseDetection, ChartLicensePerCam } from '../../../components'

interface Props {

}

const ContentChart: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div>
      <section>
        <ChartLicenseDetection />
      </section>
      <section className='mt-5'>
        <ChartLicensePerCam />
      </section>
    </div>
  )
}

export default React.memo<Props>(ContentChart)
