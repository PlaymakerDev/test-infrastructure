"use client"
import React, { Suspense } from 'react'
import StatisticsScreen from '@/features/admin/statistics/overall/screen'

const StatisticsPage = () => {
  return (
    <Suspense>
      <StatisticsScreen />
    </Suspense>
  )
}

export default React.memo(StatisticsPage)
