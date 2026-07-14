"use client"
import { Col, Row, Skeleton } from 'antd'
import React from 'react'

export type StatCardColor = 'yellow' | 'teal' | 'gray'

export interface StatCardItem {
  icon: React.ReactNode
  title: string
  count: number | string
  unit?: string
  activeLabel?: string
  color: StatCardColor
  isLoading?: boolean
}

const COLOR_MAP: Record<StatCardColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-[#FFB1001A]', border: 'border-(--yellow)', text: 'text-(--yellow)' },
  teal: { bg: 'bg-[#05F2DB1A]', border: 'border-teal-500', text: 'text-teal-500' },
  gray: { bg: 'bg-[#9797971A]', border: 'border-gray-500', text: 'text-gray-500' },
}

const StatCard: React.FC<StatCardItem> = ({ icon, title, count, unit = 'จุดติดตั้ง', activeLabel, color, isLoading }) => {
  const c = COLOR_MAP[color]
  return (
    <div className={`h-full ${c.bg} border-2 rounded-2xl p-5 ${c.border}`}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          <div className={`fs-24 ${c.text} mb-1`}>{icon}</div>
          <h3 className={c.text}>{title}</h3>
          <p>
            <span className='fs-24 font-bold'>{count}</span> {unit}
          </p>
          {activeLabel && <p className='fs-11 text-gray-400'>{activeLabel}</p>}
        </>
      )}
    </div>
  )
}

export interface StatCardRowProps {
  cards: StatCardItem[]
}

export const StatCardRow: React.FC<StatCardRowProps> = ({ cards }) => (
  <Row gutter={[16, 16]}>
    {cards.map((card, i) => (
      <Col key={i} xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <StatCard {...card} />
      </Col>
    ))}
  </Row>
)

export default StatCard
