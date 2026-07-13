import React, { useDeferredValue, useMemo, useState } from 'react'
import { TableWIM } from '../components'
import WIMLocationSection from './sections/wim/WIMLocationSection'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getTrackingSumWIMAPI } from '@/services/routes/TrackingService'

const WIMSection = () => {
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_sum_wim'],
    queryFn: () => getTrackingSumWIMAPI({ date: dayjs().format('YYYY-MM-DD') }),
    // placeholderData: keepPreviousData,
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
        <WIMLocationSection
          onSearch={setSearchText}
        />
      </section>
      <section className='mt-5'>
        <TableWIM
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo(WIMSection)
