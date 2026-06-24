"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import ScreenDetailTrafficVolume from '@/features/admin/traffic-volume/detail/screen'

const TrafficVolumeDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <ScreenDetailTrafficVolume id={id} />
}

export default React.memo(TrafficVolumeDetailPage)
