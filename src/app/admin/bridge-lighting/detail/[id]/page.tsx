"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import BridgeLightingDetailScreen from '@/features/admin/bridge-lighting/detail/screen'

const BridgeLightingDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <BridgeLightingDetailScreen id={id} />
}

export default React.memo(BridgeLightingDetailPage)
