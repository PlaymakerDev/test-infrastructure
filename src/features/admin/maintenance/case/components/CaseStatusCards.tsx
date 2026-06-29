"use client"
import React from 'react'
import { REPAIR_STATUS_CONFIG, RepairStatus } from '../data/mockData'

interface Props {
  repairStatus: RepairStatus
  problemCategory: string
}

const CaseStatusCards: React.FC<Props> = ({ repairStatus, problemCategory }) => {
  const statusConfig = REPAIR_STATUS_CONFIG[repairStatus]
  return (
    <section className='mt-5 px-10 flex gap-4'>
      <div
        style={{
          width: 300,
          height: 110,
          borderRadius: 20,
          background: statusConfig.bg,
          border: `2px solid ${statusConfig.color}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
          paddingLeft: 24,
        }}
      >
        <p style={{ color: statusConfig.color, fontWeight: 400, fontSize: 14, margin: 0 }}>สถานะซ่อมแซม</p>
        <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>{statusConfig.label}</p>
      </div>
      <div
        style={{
          width: 300,
          height: 110,
          borderRadius: 20,
          background: '#FFFFFF1A',
          border: '2px solid #FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
          paddingLeft: 24,
        }}
      >
        <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: 0, opacity: 0.6 }}>หมวดปัญหา</p>
        <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16, margin: 0 }}>{problemCategory}</p>
      </div>
    </section>
  )
}

export default React.memo(CaseStatusCards)
