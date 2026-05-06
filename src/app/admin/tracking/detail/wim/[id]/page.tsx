"use client"
import React from 'react'
import WIMDetailScreen from '@/features/admin/tracking/detail/wim/screen'
import { useParams } from 'next/navigation'

const WIMDetailPage = () => {
  const params = useParams()

  return <WIMDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(WIMDetailPage)