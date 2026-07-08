"use client"
import React from 'react'
import { Col, Row, Skeleton } from 'antd'
import { TbHandClick, TbTruck, TbUser, TbUserX } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import { useCrosswalkSummaryDaily } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'
import type { ViolationFilter } from './filter'

interface Props {
  filter: ViolationFilter
}

interface CardProps {
  icon: React.ReactNode
  label: string
  color: 'white' | 'blue' | 'red' | 'orange'
  value: number
  unit: string
  isLoading?: boolean
}

const COLOR_MAP: Record<CardProps['color'], { border: string; text: string }> = {
  white: { border: 'border-[#FFFFFF]', text: 'text-[#FFFFFF]' },
  blue: { border: 'border-[#66AEFF]', text: 'text-[#66AEFF]' },
  red: { border: 'border-[#E94C4C]', text: 'text-[#E94C4C]' },
  orange: { border: 'border-[#FF7B00]', text: 'text-[#FF7B00]' },
}

const Card: React.FC<CardProps> = ({ icon, label, color, value, unit, isLoading }) => {
  const c = COLOR_MAP[color]
  return (
    <div className={`h-full bg-[#66AEFF1A] border ${c.border} py-3 px-5 rounded-[20px]`}>
      <span className={`fs-22 mb-1 ${c.text}`}>{icon}</span>
      <h4 className={`${c.text} mb-1`}>{label}</h4>
      {isLoading ? (
        <Skeleton active paragraph={false} title={{ width: 120 }} />
      ) : (
        <p className='mb-0.5'>
          <span className='fs-18 font-bold'>{fmtNumber(value, 0)}</span>{' '}
          <span className='fs-14'>{unit}</span>
        </p>
      )}
    </div>
  )
}

const ViolationStatCard: React.FC<Props> = ({ filter }) => {
  const { id } = useDetailContext()

  const { data, isLoading } = useCrosswalkSummaryDaily({
    solution_id: id,
    start_date: filter.startDate || undefined,
    end_date: filter.endDate || undefined,
  })

  const crossing = data?.crossing
  const totals = {
    crossingTotal: crossing?.total ?? 0,
    buttonPressed: crossing?.button_pressed ?? 0,
    pedViolation: crossing?.violation ?? 0,
    redLightViolation: crossing?.red_light_violation ?? 0,
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbUser />}
          label='คนข้ามทั้งหมด'
          color='white'
          value={totals.crossingTotal}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbHandClick />}
          label='การกดปุ่ม'
          color='blue'
          value={totals.buttonPressed}
          unit='ครั้ง'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbUserX />}
          label='คนข้ามฝ่าฝืนสัญญาณไฟ'
          color='red'
          value={totals.pedViolation}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbTruck />}
          label='รถข้ามฝ่าฝืนสัญญาณไฟ'
          color='orange'
          value={totals.redLightViolation}
          unit='คัน'
          isLoading={isLoading}
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ViolationStatCard)
