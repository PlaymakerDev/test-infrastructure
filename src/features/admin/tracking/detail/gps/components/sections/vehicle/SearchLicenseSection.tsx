import React, { useMemo, useState } from 'react'
import { FormSearchLicense, LicenseTabContent } from '../../../components'
import { VehicleLocationData } from '@/types/tracking/detail-gps-api'

interface Props {
  openFromDrawer?: boolean
  data?: VehicleLocationData

}

const SearchLicenseSection: React.FC<Props> = (props) => {
  const { openFromDrawer, data } = props
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    if (!data) return data
    const keyword = search.trim().toLowerCase()
    if (!keyword) return data
    return {
      ...data,
      car_list: data.car_list.filter((car) => (car.plate_no ?? '').toLowerCase().includes(keyword)),
    }
  }, [data, search])

  return (
    <div className={`bg-(--dark-black) rounded-tl-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}>
      <section>
        <FormSearchLicense onSearch={setSearch} />
      </section>
      <section className='mt-5'>
        <LicenseTabContent
          data={filteredData}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchLicenseSection)
