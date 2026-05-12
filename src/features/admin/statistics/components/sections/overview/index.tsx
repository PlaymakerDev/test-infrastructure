"use client"
import React from 'react'

const OverviewSection: React.FC = () => {
  return (
    <div className="mt-6 flex flex-wrap gap-4">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="rounded-[20px]"
          style={{ width: 585, height: 740, backgroundColor: '#191919' }}
        />
      ))}
    </div>
  )
}

export default React.memo(OverviewSection)
