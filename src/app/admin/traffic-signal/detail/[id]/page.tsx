"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import ScreenDetailTrafficSignal from '@/features/admin/traffic-signal/detail/screen/ScreenDetailTrafficSignal'

const TrafficSignalDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <ScreenDetailTrafficSignal id={id} />
}

export default React.memo(TrafficSignalDetailPage)
