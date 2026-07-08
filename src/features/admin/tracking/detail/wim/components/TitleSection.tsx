import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { useQuery } from '@tanstack/react-query';
import { getTrackingStationByIDAPI, getTrackingWIMByIDAPI } from '@/services/routes/TrackingDetailService';
import { Skeleton } from 'antd';

interface Props {
  id: string[] | string | number | undefined;
  stationType: string | null | undefined;
  setCurrentTab: (value: string) => void;
}


const OPTIONS = [
  {
    label: 'ภาพรวม',
    value: 'OVERALL'
  },
  {
    label: 'ข้อมูลรถเข้าชั่งน้ำหนัก',
    value: 'VEHICLE'
  },
  {
    label: 'กล้องบันทึกภาพ (CCTV)',
    value: 'CCTV'
  },

]

const TitleSection: React.FC<Props> = (props) => {
  const { id, stationType, setCurrentTab } = props
  const router = useRouter()

  const { data: wimData, isLoading: isWimLoading, isError: isWimError } = useQuery({
    queryKey: ['tracking_wim_by_id', id],
    queryFn: () => getTrackingWIMByIDAPI(id as string | number),
    enabled: !!id && stationType === 'WIM',
  })

  const { data: stationData, isLoading: isStationLoading, isError: isStationError } = useQuery({
    queryKey: ['tracking_station_by_id', id],
    queryFn: () => getTrackingStationByIDAPI(id as string | number),
    enabled: !!id && stationType === 'STATION',
  })

  const renderStationTitle = useMemo(() => {
    if (isStationLoading) return <Skeleton loading={isStationLoading} active paragraph={{ rows: 1 }} />
    if (isStationError) return '-'
    return `สถานี : ${stationData?.data?.data.station_name}` || '-'
  }, [isStationLoading, isStationError, stationData])

  const renderWimTitle = useMemo(() => {
    if (isWimLoading) return <Skeleton loading={isWimLoading} active paragraph={{ rows: 1 }} />
    if (isWimError) return '-'
    return `Weight in Motion (WIM) : ${wimData?.data?.data.station_name}` || '-'
  }, [isWimLoading, isWimError, wimData])

  const renderTitle = useMemo(() => {
    if (stationType === 'WIM') return renderWimTitle
    if (stationType === 'STATION') return renderStationTitle
    return '-'
  }, [stationType, renderWimTitle, renderStationTitle])

  return (
    <div className='px-3'>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2'
          onClick={() => router.back()}
        />
        <div>
          <h1 className='text-(--yellow)'>{renderTitle}</h1>
          <p className='text-(--yellow)'>ระบบตรวจวัดน้ำหนักยานพาหนะขณะเคลื่อนที่</p>
        </div>
      </section>
      <section className='mt-5 px-10'>
        <SwapButton
          options={OPTIONS}
          defaultActive="OVERALL"
          setLabelValue={(value) => setCurrentTab(value)}
        />
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)
