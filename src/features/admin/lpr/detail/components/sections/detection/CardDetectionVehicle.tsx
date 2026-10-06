import React from 'react'
// import { DataType } from './GridDetectionData'
import { Divider, Image } from 'antd'
import { FALLBACK } from '@/constants/shared'
import { useAppDispatch } from '@/stores/hooks'
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { LPRPlateData } from '@/types/lpr/new-lpr-api'
import { VEHICLE_TYPE_COLOR } from '@/constants'
import { getConfidenceColor, parseConfidence } from './TableDetectionData'

interface Props {
  data: LPRPlateData
}

const CardDetectionVehicle: React.FC<Props> = (props) => {
  const { data } = props
  const dispatch = useAppDispatch()

  // A missing confidence only blanks that one line ('-', muted). Don't early-
  // return the whole card here — it would also skip the hooks below.
  const confidence = parseConfidence(data.confidence)

  const handleOpenModal = () => {
    dispatch(setLicenseDetailModalOpen({ open: true, data }))
  }

  return (
    <div
      className='p-5 bg-(--dark-black) rounded-2xl h-full cursor-pointer'
      onClick={handleOpenModal}
    >
      <section>
        <div className='flex justify-between items-start gap-3'>
          <div className='flex flex-col'>
            <h2>{data?.plate_number || '-'}</h2>
            <p>{data?.plate_province || '-'}</p>
          </div>
          <div
            className='inline-block border rounded-3xl px-3 text-center'
            style={{
              color: VEHICLE_TYPE_COLOR[data?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
              borderColor: VEHICLE_TYPE_COLOR[data?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
            }}
          >
            <p className='fs-12'>{data?.vehicle_type_name || 'ไม่ระบุ'}</p>
          </div>
        </div>
        <p className='text-white/50'>{data?.captured_at_display || '-'}</p>
      </section>
      <Divider variant='dashed' className='border-white/50! my-3!' />
      <section>
        <p className='text-(--default-blue)'>ชื่อกล้อง : {data?.camera_name || '-'}</p>
        <p>IP Address : {data?.camera_ip}</p>
        {confidence == null ? (
          <p className='text-white/50'>Confidence : -</p>
        ) : (
          <p style={{ color: getConfidenceColor(confidence) }}>Confidence : {confidence.toFixed(1)}%</p>
        )}
      </section>
      <section className='mt-3'>
        <figure
          className='figure-normal rounded-lg overflow-hidden mb-3'
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={data?.plate_image}
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
