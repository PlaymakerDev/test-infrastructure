"use client"
import React from 'react'
import { Col, Row } from 'antd'
import { useOverallContext } from '../../../context'

/** Right rail — 4 stat cards summarising the lighting fleet (ตู้ควบคุม /
 *  โคมไฟ / ในค้ำ / หมดค้ำ). Values + the per-card `Active : n (x%)` line come
 *  from `statCards` in OverallContext (derived from `/central/list`).
 *
 *  Card shell mirrors `InfoCardTrafficVolume.tsx` exactly — 10% tint of the
 *  card colour, `border-2 rounded-2xl p-5`, icon → coloured `h3` → big value +
 *  unit → grey Active line — so this rail now reads the same as every other
 *  overall page. Colours stay data-driven (context supplies the hex per card),
 *  hence inline style rather than Tailwind token classes. */
const InfoCardTrafficLighting: React.FC = () => {
  const { statCards, centralListLoaded } = useOverallContext()

  // Keep the layout stable while loading — same treatment as traffic-volume.
  const dim = centralListLoaded ? '' : 'opacity-50'

  return (
    <Row gutter={[16, 16]}>
      {statCards.map((card) => (
        <Col key={card.title} xs={24} sm={24} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
          <div
            className={`h-full border-2 rounded-2xl p-5 ${dim}`}
            style={{ background: `${card.titleColor}1A`, borderColor: card.titleColor }}
          >
            <img src={card.icon} alt='' className='w-6 h-6 mb-1' />
            <h3 style={{ color: card.titleColor }}>{card.title}</h3>
            <p>
              <span className='fs-24 font-bold'>{card.value}</span> จุดติดตั้ง
            </p>
            <p className='fs-12 text-gray-400'>Active : {card.active}</p>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default React.memo(InfoCardTrafficLighting)
