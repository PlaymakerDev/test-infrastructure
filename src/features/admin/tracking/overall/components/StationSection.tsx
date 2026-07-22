"use client"
import React, { useDeferredValue, useMemo, useState } from 'react'
import { StationLocationSection, TableStation } from '../components'
import { useSumStation } from '../hooks'
import dayjs from 'dayjs'

const StationSection: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)

  const { data, isLoading, isError } = useSumStation({ date: dayjs().format('YYYY-MM-DD') })

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
          onSearch={setSearchText}
          searchText={deferredSearch}
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
