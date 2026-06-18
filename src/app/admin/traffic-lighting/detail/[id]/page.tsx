"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import TrafficLightingDetailScreen from '@/features/admin/traffic-lighting/detail/screen'

const TrafficLightingDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <TrafficLightingDetailScreen id={id} />
}

export default React.memo(TrafficLightingDetailPage)
