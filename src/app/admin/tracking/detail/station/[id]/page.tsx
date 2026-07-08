"use client"
import React from 'react'
import StationDetailScreen from '@/features/admin/tracking/detail/wim/screen'
import { useParams } from 'next/navigation'

const StationDetailPage = () => {
  const params = useParams()

  return <StationDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(StationDetailPage)