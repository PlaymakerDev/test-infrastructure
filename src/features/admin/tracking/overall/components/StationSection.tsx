"use client"
import React, { useDeferredValue, useMemo, useState } from 'react'
import { StationLocationSection, TableStation } from '../components'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTrackingSumStationAPI } from '@/services/routes/TrackingService'
import dayjs from 'dayjs'

const StationSection: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_sum_station'],
    queryFn: () => getTrackingSumStationAPI({ date: dayjs().format('YYYY-MM-DD') }),
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
        <StationLocationSection
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
          onSearch={setSearchText}
        />
      </section>
      <section className='mt-5'>
        <TableStation
          data={filteredData}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo(StationSection)
