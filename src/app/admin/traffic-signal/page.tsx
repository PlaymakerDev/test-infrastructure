export const dynamic = "force-dynamic";
import React from 'react'
import ScreenOverallTrafficSignal from '@/features/admin/traffic-signal/overall/screen/ScreenOverallTrafficSignal'

const TrafficSignalPage = () => {
  return <ScreenOverallTrafficSignal />
}

export default React.memo(TrafficSignalPage)
