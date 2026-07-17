"use client"
import React from 'react'
import StationDetailScreen from '@/features/admin/tracking/detail/wim/screen'
import { useParams, notFound } from 'next/navigation'

const StationDetailPage = () => {
  const params = useParams()

  if (!params.id) notFound()

  return <StationDetailScreen id={params.id} />
}

export default React.memo(StationDetailPage)