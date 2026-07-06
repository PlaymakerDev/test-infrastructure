import React, { useDeferredValue, useMemo, useState } from 'react'
import { MobileLocationSection, TableMobile } from '../components'
import ChartMobileUnitPlan from './sections/mobile/ChartMobileUnitPlan'
import { getTrackingSumMobileAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const MobileSection = () => {
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_sum_wim'],
    queryFn: () => getTrackingSumMobileAPI({ date: dayjs().format('YYYY-MM-DD') }),
    placeholderData: keepPreviousData,
  })

  const filteredData = useMemo(() => {
    const allData = data?.data.data ?? []
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return allData
    return allData.filter((s) => s.name?.toLowerCase().includes(q))
  }, [data, deferredSearch])

  return (
    <div>
      <section>
        <MobileLocationSection
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
          onSearch={setSearchText}
        />
      </section>
      <section className='mt-5'>
        <ChartMobileUnitPlan />
      </section>
      <section className='mt-5'>
        <TableMobile
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
