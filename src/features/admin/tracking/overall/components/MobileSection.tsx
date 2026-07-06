import React from 'react'
import { MobileLocationSection, TableMobile, MobileUnitPlanSection } from '../components'
import { getTrackingMobileMasterAPI, getTrackingViewSumPlanChartAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useOverallContext } from '../context'

const MobileSection = () => {
  const { searchMobileMaster, searchSumPlan } = useOverallContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_mobile_master', searchMobileMaster?.search],
    queryFn: () => getTrackingMobileMasterAPI({
      start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
      page: 1,
      page_size: 10,
      ordering: 'asc',
      search: searchMobileMaster?.search || ''
    }),
    placeholderData: keepPreviousData,
  })

  const {
    data: sumPlanData,
    isLoading: isSumPlanLoading,
    isError: isSumPlanError
  } = useQuery({
    queryKey: ['sum_plan', searchSumPlan],
    queryFn: () => getTrackingViewSumPlanChartAPI({ ...searchSumPlan }),
    placeholderData: keepPreviousData
  })

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
        />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
