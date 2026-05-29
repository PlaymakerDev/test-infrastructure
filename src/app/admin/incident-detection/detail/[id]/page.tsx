"use client"
import React from 'react'
import IncidentDetectionDetailScreen from '@/features/admin/incident-detection/detail/screen'
import { useParams } from 'next/navigation'

const IncidentDetectionDetailPage = () => {
  const params = useParams()

  return <IncidentDetectionDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(IncidentDetectionDetailPage)
