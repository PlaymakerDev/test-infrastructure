import React, { useMemo } from 'react'
import { StationLocationSection, TableStation } from '../components'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTrackingSumStationAPI } from '@/services/routes/TrackingService'
import dayjs from 'dayjs'

interface Props {

}

const StationSection: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_sum_station',],
    queryFn: () => getTrackingSumStationAPI({
      date: dayjs().format('YYYY-MM-DD'),
    }),
    placeholderData: keepPreviousData
  })

  return (
    <div>
      <section>
        <StationLocationSection
          data={data?.data.data || []}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
      <section className='mt-5'>
        <TableStation
          data={data?.data.data || []}
          isLoading={isLoading}
          isError={isError}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(StationSection)
