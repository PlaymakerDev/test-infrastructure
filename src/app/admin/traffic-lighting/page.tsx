import { Suspense } from 'react'
import TrafficLightingScreen from '@/features/admin/traffic-lighting/overall/screen'

export default function TrafficLightingPage() {
  return (
    <Suspense>
      <TrafficLightingScreen />
    </Suspense>
  )
}
