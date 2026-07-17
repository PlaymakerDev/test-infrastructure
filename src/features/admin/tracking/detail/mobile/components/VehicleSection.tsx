import React, { useMemo } from 'react'
import {
  FormSearchVehicle,
  VehicleStatCard,
  TableVehicleData
} from '../components'
import { useQuery } from '@tanstack/react-query';
import { getTrackingMobileDailyCountAPI, getTrackingMobileMasterAPI } from '@/services/routes/TrackingDetailService';
import dayjs from 'dayjs';
import { Empty, Skeleton } from 'antd';

interface Props {
  id: string[] | string | number | undefined;
}

const VehicleSection: React.FC<Props> = (props) => {
  const { id } = props

  const {
    data: mobileMasterData,
    isLoading: isMobileMasterLoading,
    isError: isMobileMasterError
  } = useQuery({
    queryKey: ['mobile_master_data', id],
    queryFn: () => getTrackingMobileMasterAPI({
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
    })
  })

  const {
    data: mobileCountData,
    isLoading: isMobileCountLoading,
    isError: isMobileCountError
  } = useQuery({
    queryKey: ['mobile_count', id],
    queryFn: () => getTrackingMobileDailyCountAPI({
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
      tid: String(id),
    }),
  })

  const renderContent = useMemo(() => {
    if (isMobileCountLoading) return <Skeleton loading={isMobileCountLoading} active paragraph={{ rows: 10 }} />
    if (isMobileCountError) return <Empty description="ไม่พบข้อมูล" />
    return <VehicleStatCard data={mobileCountData?.data.data} />
  }, [isMobileCountLoading, isMobileCountError, mobileCountData])

  return (
    <div>
      <section>
        <FormSearchVehicle />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
      <section className='mt-5'>
        <TableVehicleData />
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleSection)
