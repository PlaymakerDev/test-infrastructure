import React, { useCallback } from 'react'
import { DataType } from './GridDetectionData'
import { Divider, Image } from 'antd'
import { FALLBACK } from '@/constants/shared'
import { useAppDispatch } from '@/stores/hooks'
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice'

interface Props {
  data: DataType
}

const CardDetectionVehicle: React.FC<Props> = (props) => {
  const { data } = props
  const dispatch = useAppDispatch()

  const handleOpenModal = useCallback(() => {
    dispatch(setLicenseDetailModalOpen({ open: true }))
  }, [dispatch])

  return (
    <div
      className='p-5 bg-(--dark-black) rounded-2xl h-full cursor-pointer'
      onClick={handleOpenModal}
    >
      <section>
        <div className='flex justify-between items-start gap-3'>
          <div className='flex flex-col'>
            <h2>{data.license_number || '-'}</h2>
            <p>{data.license_province || '-'}</p>
          </div>
          <div className='inline-block text-[#00FFAA] border border-[#00FFAA] rounded-3xl px-3 text-center'>
            <p className='fs-12'>{data.license_type}</p>
          </div>
        </div>
        <p className='text-white/50'>{data.timestamp || '-'}</p>
      </section>
      <Divider variant='dashed' className='border-white/50! my-3!' />
      <section>
        <p className='text-(--default-blue)'>ชื่อกล้อง : {data.camera_name || '-'}</p>
        <p>IP Address : {data.ip_address || '-'}</p>
        <p className='text-(--yellow)'>Confidence : {data.confidence_level || '-'}</p>
      </section>
      <section className='mt-3'>
        <figure
          className='figure-normal rounded-lg overflow-hidden mb-3'
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={data.license_image}
            alt='img-01'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
      </section>
    </div>
  )
}

export default React.memo<Props>(CardDetectionVehicle)
