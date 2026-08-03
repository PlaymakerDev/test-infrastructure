import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import ProvinceTrafficLayer from './ProvinceTrafficLayer'
import { getTrackingGPSProvinceSummaryAPI } from '@/services/routes/TrackingGPSService'
import { useQuery } from '@tanstack/react-query'
import { Empty } from 'antd'
import React from 'react'
import { TbTruck } from 'react-icons/tb'

interface Props {

}

const MapOverallSection: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking_province_summary'],
    queryFn: () => getTrackingGPSProvinceSummaryAPI()
  })

  if (isError) return <Empty description='เกิดข้อผิดพลาดในการโหลดข้อมูล' />

  return (
    <div className='relative w-full h-220 rounded-lg overflow-hidden'>
      <BaseMap
        initialCenter={[101.0, 14.5]}
        initialZoom={5.4}
        edgeFade={{ all: 10 }}
      >
        <ThailandMaskLayer />
        <ProvinceTrafficLayer provinces={data?.data ?? []} />
      </BaseMap>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
            <span className='text-yellow-400 text-xs'>กำลังโหลด...</span>
          </div>
        </div>
      )}

      <div className='absolute bottom-5 right-5'>
        <div className='bg-black/60 p-3 rounded-lg w-72'>
          <div className='flex items-center gap-3'>
            <TbTruck className='text-(--yellow) fs-18' />
            <h4 className='text-(--yellow) font-normal!'>รถบนสายทางทช.</h4>
          </div>
          <div className='mt-3'>
            <div className='h-2.5 rounded-full bg-[linear-gradient(90deg,#8F8F8F_0%,#FFB100_41.35%,#FF6600_78.85%,#FF0000_100%)]' />
            <div className='flex items-center justify-between mt-1.5'>
              <span className='fs-12 text-gray-400'>น้อย</span>
              <span className='fs-12 text-gray-400'>มาก</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(MapOverallSection)
