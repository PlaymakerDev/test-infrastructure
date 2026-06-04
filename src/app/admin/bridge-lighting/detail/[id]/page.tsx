"use client"
import React from 'react'
import DetailScreen from '@/features/admin/bridge-lighting/detail/screen'
import { useParams } from 'next/navigation'

const BridgeLightingDetailPage = () => {
  const params = useParams()

  return <DetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(BridgeLightingDetailPage)
