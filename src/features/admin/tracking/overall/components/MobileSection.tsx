import React, { useState } from 'react'
import { MobileLocationSection, TableMobile, MobileUnitPlanSection } from '../components'
import { useMobileMaster, useSumPlanChart } from '../hooks'
import dayjs from 'dayjs'
import { useOverallContext } from '../context'

const DEFAULT_PAGE_SIZE = 10

const MobileSection = () => {
  const { searchMobileMaster, searchSumPlan } = useOverallContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevSearch, setPrevSearch] = useState(searchMobileMaster?.search)
  if (searchMobileMaster?.search !== prevSearch) {
    setPrevSearch(searchMobileMaster?.search)
    setPage(1)
  }

  const { data, isLoading, isError } = useMobileMaster({
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    page,
    page_size: pageSize,
    ordering: 'asc',
    search: searchMobileMaster?.search || ''
  })

  const {
    data: sumPlanData,
    isLoading: isSumPlanLoading,
    isError: isSumPlanError
  } = useSumPlanChart({ ...searchSumPlan })

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  return (
    <div>
      <section>
        <MobileLocationSection
          data={data?.data.data ?? []}
          meta={data?.data.meta}
          isLoading={isLoading}
          isError={isError}
          sumPlanData={sumPlanData?.data}
          isSumPlanLoading={isSumPlanLoading}
          isSumPlanError={isSumPlanError}
        />
      </section>
      <section className='mt-5'>
        <MobileUnitPlanSection
          data={sumPlanData?.data}
          isLoading={isSumPlanLoading}
          isError={isSumPlanError}
        />
      </section>
      <section className='mt-5'>
        <TableMobile
          data={data?.data.data ?? []}
          meta={data?.data.meta}
          isLoading={isLoading}
          isError={isError}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
