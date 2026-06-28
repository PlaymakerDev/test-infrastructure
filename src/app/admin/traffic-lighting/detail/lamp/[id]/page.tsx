"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import LampDetailScreen from '@/features/admin/traffic-lighting/detail/lamp/screen'

const LampDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <LampDetailScreen id={id} />
}

export default React.memo(LampDetailPage)
