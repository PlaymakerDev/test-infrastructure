import { FALLBACK, VEHICLE_TYPE_COLOR } from '@/constants'
import { useAppDispatch } from '@/stores/hooks'
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { Button, Empty, Image, Skeleton } from 'antd'
import React, { useCallback } from 'react'
import { TbCar } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context'
import { useQuery } from '@tanstack/react-query'
import { getLPRPlateAPI } from '@/services/routes/NewLPRService'
import { LPRPlateData } from '@/types/lpr/new-lpr-api'
import { getConfidenceColor, parseConfidence } from '../detection/TableDetectionData'

interface Props {

}

const ContentLicenseDetail: React.FC<Props> = (props) => {
  const { } = props
  const dispatch = useAppDispatch()
  const { solutionId } = useLPRDetailContext()

  const handleOpenModal = useCallback((data: LPRPlateData) => {
    dispatch(setLicenseDetailModalOpen({ open: true, data }))
  }, [dispatch])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-plate', solutionId],
    queryFn: () => getLPRPlateAPI(solutionId, { limit: 1 }),
    enabled: !!solutionId,
  })

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  const confidence = parseConfidence(data?.data?.res_data?.[0]?.confidence)

  return (
    <div className='p-5 bg-(--dark-black) rounded-2xl h-full'>
      <section>
        <div className='flex items-center gap-2'>
          <TbCar className='text-(--yellow) fs-22' />
          <h4 className='text-(--yellow) font-normal!'>ป้ายทะเบียนล่าสุด</h4>
        </div>
      </section>
      <section className='mt-5'>
        <figure className='h-52 rounded-lg overflow-hidden mb-3'>
          <Image
            src={data?.data?.res_data?.[0]?.vehicle_image}
            alt='img-01'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
        <figure className='h-40 rounded-lg overflow-hidden'>
          <Image
            src={data?.data?.res_data?.[0]?.plate_image}
            alt='img-02'
            width={'100%'}
            height={'100%'}
            className='object-cover object-center'
            fallback={FALLBACK}
          />
        </figure>
      </section>
      <section className='mt-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex flex-col'>
            <h2>{data?.data?.res_data?.[0]?.plate_number || '-'}</h2>
            <p>{data?.data?.res_data?.[0]?.plate_province || '-'}</p>
          </div>
          <span
            className='shrink-0 fs-12 border rounded-full px-3 py-0.5 whitespace-nowrap'
            style={{
              color: VEHICLE_TYPE_COLOR[data?.data?.res_data?.[0]?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
              borderColor: VEHICLE_TYPE_COLOR[data?.data?.res_data?.[0]?.vehicle_type_name as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
            }}
          >
            {data?.data?.res_data?.[0]?.vehicle_type_name || 'ไม่ระบุ'}
          </span>
        </div>
        <div className='flex flex-col'>
          {confidence == null ? (
            <p className='text-white/50'>Confidence : -</p>
          ) : (
            <p style={{ color: getConfidenceColor(confidence) }}>Confidence : {confidence.toFixed(1)}%</p>
          )}
          <p>{data?.data?.res_data?.[0]?.captured_at_display}</p>
          <p className='text-(--default-blue)'>ชื่อกล้อง : {data?.data?.res_data?.[0]?.camera_name || '-'}</p>
        </div>
      </section>
      <section className='mt-5'>
        <Button
          block
          type="primary"
          shape='round'
          onClick={() => handleOpenModal(data?.data?.res_data?.[0] as LPRPlateData)}
        >
          ดูประวัติ
        </Button>
      </section>
    </div>
  )
}

export default React.memo<Props>(ContentLicenseDetail)
