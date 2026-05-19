import React from 'react'
import { FormSearchLicense, LicenseTabContent } from '../../../components'
import { RoadList } from '@/components/list'
import { useGPSContext } from '../../../context'

interface Props {
  openFromDrawer?: boolean
}

const SearchLicenseSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props
  const { setRoute } = useGPSContext()

  return (
    <div className={`bg-(--dark-black) rounded-tl-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}>
      <section>
        <FormSearchLicense />
      </section>
      <section className='mt-5'>
        <LicenseTabContent />
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchLicenseSection)
