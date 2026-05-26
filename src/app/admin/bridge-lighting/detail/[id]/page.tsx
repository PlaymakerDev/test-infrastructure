"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import ScreenDetailBridgeLighting from '@/features/admin/bridge-lighting/detail/screen/ScreenDetailBridgeLighting'

const BridgeLightingDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <ScreenDetailBridgeLighting id={id} />
}

export default React.memo(BridgeLightingDetailPage)
