"use client"
import React from 'react'
import { Col, Row, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { TbHandClick, TbTruck, TbUser, TbUserX } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import { useCrosswalkSummaryDaily } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'

interface Props {}

interface CardProps {
  icon: React.ReactNode
  label: string
  /** Border + label + icon tint. Use "white" for the un-tinted first card. */
  color: 'white' | 'blue' | 'red' | 'orange' | 'yellow' | 'lime'
  value: number
  unit: string
  isLoading?: boolean
}

const COLOR_MAP: Record<CardProps['color'], { border: string; text: string }> = {
  white: { border: 'border-[#FFFFFF]', text: 'text-[#FFFFFF]' },
  blue: { border: 'border-[#66AEFF]', text: 'text-[#66AEFF]' },
  red: { border: 'border-[#E94C4C]', text: 'text-[#E94C4C]' },
  orange: { border: 'border-[#FF7B00]', text: 'text-[#FF7B00]' },
  yellow: { border: 'border-[#FCD116]', text: 'text-[#FCD116]' },
  lime: { border: 'border-[#B2FF00]', text: 'text-[#B2FF00]' },
}

const Card: React.FC<CardProps> = ({ icon, label, color, value, unit, isLoading }) => {
  const c = COLOR_MAP[color]
  return (
    <div className={`bg-[#66AEFF1A] border ${c.border} py-3 px-5 rounded-[20px]`}>
      <div className='flex items-center gap-2 mb-2'>
        <span className={`fs-22 shrink-0 ${c.text} flex items-center`}>{icon}</span>
        <h4 className={`${c.text} mb-0`}>{label}</h4>
      </div>
      {isLoading ? (
        <Skeleton active paragraph={false} title={{ width: 120 }} />
      ) : (
        <p className='mb-0.5'>
          <span className='fs-18 font-bold'>{fmtNumber(value, unit === 'km/h' ? 2 : 0)}</span>{' '}
          <span className='fs-14'>{unit}</span>
        </p>
      )}
    </div>
  )
}

const InfoCardSection: React.FC<Props> = () => {
  const { id } = useDetailContext()
  const { data, isLoading } = useCrosswalkSummaryDaily({
    solution_id: id,
    start_date: dayjs().format('YYYY-MM-DD'),
  })

  const crossing = data?.crossing
  const counting = data?.counting

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbUser />}
          label='คนข้ามทั้งหมด'
          color='white'
          value={crossing?.total ?? 0}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbHandClick />}
          label='การกดปุ่ม'
          color='blue'
          value={crossing?.button_pressed ?? 0}
          unit='ครั้ง'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbUserX />}
          label='คนข้ามฝ่าฝืนสัญญาณไฟ'
          color='red'
          value={crossing?.violation ?? 0}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbTruck />}
          label='รถข้ามฝ่าฝืนสัญญาณไฟ'
          color='orange'
          value={crossing?.red_light_violation ?? 0}
          unit='คัน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbTruck />}
          label='ปริมาณจราจรประจำวัน'
          color='yellow'
          value={counting?.total_count ?? 0}
          unit='คัน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <Card
          icon={<TbTruck />}
          label='ความเร็วเฉลี่ยประจำวัน'
          color='lime'
          value={counting?.avg_speed ?? 0}
          unit='km/h'
          isLoading={isLoading}
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
