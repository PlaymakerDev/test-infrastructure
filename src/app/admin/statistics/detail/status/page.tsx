"use client"
import React, { Suspense } from 'react'
import StatusDetailScreen from '@/features/admin/statistics/detail/status/screen'

const StatusDetailPage = () => {
  return (
    <Suspense>
      <StatusDetailScreen />
    </Suspense>
  )
}

export default React.memo(StatusDetailPage)
