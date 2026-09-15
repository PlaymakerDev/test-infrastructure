import React, { useCallback, useState } from 'react'
import { FormSearchRoad, TableRoadData } from '../components'
import { RoadSearchFormValues } from './new-road/FormSearchRoad'
import { useQuery } from '@tanstack/react-query'
import { getPaginateRoadListAPI } from '@/services/routes/ManageService'

interface Props {

}

const NewRoadSection: React.FC<Props> = (props) => {
  const { } = props

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [regionId, setRegionId] = useState<number | undefined>(undefined)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['roads', page, limit, search, regionId],
    queryFn: () => getPaginateRoadListAPI({
      page,
      limit,
      search: search || undefined,
      region_id: regionId,
    })
  })

  // A new search submission starts over at page 1 — otherwise the user
  // could land on a page past the new, narrower result set.
  const onSearch = useCallback((values: RoadSearchFormValues) => {
    setSearch(values.search?.trim() ?? '')
    setRegionId(values.region_id != null ? Number(values.region_id) : undefined)
    setPage(1)
  }, [])

  const onTableChange = useCallback((newPage: number, newLimit: number) => {
    setPage(newPage)
    setLimit(newLimit)
  }, [])

  return (
    <div>
      <section>
        <FormSearchRoad onSearch={onSearch} />
      </section>
      <section className='mt-5'>
        <TableRoadData
          data={data?.data}
          isLoading={isLoading}
          isError={isError}
          onPageChange={onTableChange}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(NewRoadSection)
