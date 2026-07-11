import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Skeleton } from 'antd';
import { useStationDetail } from '../hooks'

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

  const { data, isLoading, isError } = useStationDetail(id as string | number | undefined, stationType)

  const renderTitle = useMemo(() => {
    if (stationType !== 'WIM' && stationType !== 'STATION') return '-'
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 1 }} />
    if (isError) return '-'
    const label = stationType === 'STATION' ? 'สถานี' : 'Weight in Motion (WIM)'
    return `${label} : ${data?.data.data.station_name}` || '-'
  }, [stationType, isLoading, isError, data])

  return (
    <div className='px-8'>
      <p
        className='block mb-3 lg:hidden text-(--yellow) cursor-pointer'
        onClick={() => router.back()}
      >
        &lt; ย้อนกลับ
      </p>
      <section className='flex items-start gap-3'>
        <TbArrowBigLeftFilled
          className='fs-24 text-(--yellow) cursor-pointer mt-2 hidden lg:block'
          onClick={() => router.back()}
        />
        <div>
          <h1 className='text-(--yellow)'>{renderTitle}</h1>
          <p className='text-(--yellow)'>ระบบตรวจวัดน้ำหนักยานพาหนะขณะเคลื่อนที่</p>
        </div>
      </section>
      <section className='mt-5 px-0 lg:px-10'>
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
