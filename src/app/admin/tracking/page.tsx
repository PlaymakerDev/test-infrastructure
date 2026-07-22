export const dynamic = "force-dynamic";
import React, { Suspense } from 'react'
import TrackingScreen from '@/features/admin/tracking/overall/screen'

const TrackingPage = () => {
  return (
    <Suspense fallback={null}>
      <TrackingScreen />
    </Suspense>
  )
}

export default React.memo(TrackingPage)