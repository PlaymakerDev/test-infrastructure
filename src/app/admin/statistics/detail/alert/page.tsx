"use client"
import React, { Suspense } from 'react'
import AlertDetailScreen from '@/features/admin/statistics/detail/alert/screen'

const AlertDetailPage = () => {
  return (
    <Suspense>
      <AlertDetailScreen />
    </Suspense>
  )
}

export default React.memo(AlertDetailPage)
