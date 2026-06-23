"use client"
import React from 'react'
import { TbTools } from 'react-icons/tb'

interface Props {
  title?: string
}

const ComingSoon: React.FC<Props> = ({ title = 'Feature' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      gap: 16,
      padding: 32,
      color: '#9ca3af',
    }}>
      <TbTools size={64} />
      <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: '#e5e7eb' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 16 }}>
        อยู่ระหว่างพัฒนา / Under development
      </p>
    </div>
  )
}

export default React.memo(ComingSoon)
