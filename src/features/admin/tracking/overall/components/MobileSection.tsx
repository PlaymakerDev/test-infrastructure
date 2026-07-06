import React from 'react'
import { MobileLocationSection, TableMobile } from '../components'
import ChartMobileUnitPlan from './sections/mobile/ChartMobileUnitPlan'
import { getTrackingMobileMasterAPI } from '@/services/routes/TrackingService'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useOverallContext } from '../context'

const MobileSection = () => {
  const { searchMobileMaster } = useOverallContext()

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

  return (
    <div>
      <section>
        <MobileLocationSection
          data={data?.data.data ?? []}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
      <section className='mt-5'>
        <ChartMobileUnitPlan />
      </section>
      <section className='mt-5'>
        <TableMobile
          data={data?.data.data ?? []}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo(MobileSection)
