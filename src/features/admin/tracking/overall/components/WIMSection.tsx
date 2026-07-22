import React, { useDeferredValue, useMemo, useState } from 'react'
import { TableWIM } from '../components'
import WIMLocationSection from './sections/wim/WIMLocationSection'
import { useSumWim } from '../hooks'
import dayjs from 'dayjs'

const WIMSection = () => {
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)

  const { data, isLoading, isError } = useSumWim({ date: dayjs().format('YYYY-MM-DD') })

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
          searchText={deferredSearch}
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
