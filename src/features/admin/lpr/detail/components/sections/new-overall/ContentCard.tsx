import { IconLPR } from '@/components/icon'
import { useQuery } from '@tanstack/react-query'
import { Col, Empty, Row, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React from 'react'
import { TbBroadcast, TbCar, TbHourglassHigh } from 'react-icons/tb'
import { useLPRDetailContext } from '../../../context'
import { getLPRStatAPI } from '@/services/routes/NewLPRService'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {

}

const ContentCard: React.FC<Props> = (props) => {
  const { } = props
  const { solutionId } = useLPRDetailContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-stats', solutionId],
    queryFn: () => getLPRStatAPI(solutionId),
    enabled: !!solutionId,
  })

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  const topProvincePercentage = (Number(data?.data?.top_province?.count) / Number(data?.data?.total)) * 100
  const peakHourPercentage = (Number(data?.data?.peak_hour?.count) / Number(data?.data?.total)) * 100

  // average over the hourly buckets the backend returned for today
  const hourlyToday = data?.data?.hourly_today ?? []
  const avgPerHour = hourlyToday.length
    ? hourlyToday.reduce((sum, b) => sum + b.count, 0) / hourlyToday.length
    : 0

  // hour = 16 → bucket 16:00 - 17:00
  const peakHour = data?.data?.peak_hour?.hour
  const peakHourStart = peakHour == null ? null : dayjs().startOf('day').hour(peakHour)
  const peakHourLabel = peakHourStart
    ? `${peakHourStart.format('HH:mm')} - ${peakHourStart.add(1, 'hour').format('HH:mm')} น.`
    : '-'

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-white bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <IconLPR size={28} />
            <h3>ตรวจจับป้ายทะเบียนประจำวัน</h3>
          </div>
          <p className='text-white/50'><span className='text-white fs-22 font-bold'>{fmtNumber(Number(data?.data?.total)) || 0}</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#C8FF00] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbBroadcast className='text-[#C8FF00] fs-24' />
            <h3 className='text-[#C8FF00]'>ป้ายทะเบียนเฉลี่ยรายชั่วโมง</h3>
          </div>
          <p className='text-white/50'><span className='text-white fs-22 font-bold'>{fmtNumber(avgPerHour)}</span> คัน/ชั่วโมง</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#00FF00] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbCar className='text-[#00FF00] fs-24' />
            <h3 className='text-[#00FF00]'>ป้ายทะเบียนจังหวัดที่พบสูงสุด</h3>
          </div>
          <p className='text-[#00FF00] fs-22 font-bold'>{data?.data?.top_province?.province || '-'}</p>
          <p className='text-white/50 fs-12'>{fmtNumber(Number(data?.data?.top_province?.count)) || 0} คัน ({topProvincePercentage.toFixed(1)}%)</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#00FFAA] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbHourglassHigh className='text-[#00FFAA] fs-24' />
            <h3 className='text-[#00FFAA]'>ช่วงเวลาตรวจจับป้ายทะเบียนสูงสุด</h3>
          </div>
          <p className='text-white fs-22 font-bold'>{peakHourLabel}</p>
          <p className='text-white/50 fs-12'>({peakHourPercentage.toFixed(1)}%)</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ContentCard)
