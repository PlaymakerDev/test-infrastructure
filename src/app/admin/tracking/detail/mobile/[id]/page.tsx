"use client"
import React from 'react'
import MobileDetailScreen from '@/features/admin/tracking/detail/mobile/screen'
import { useParams } from 'next/navigation'

const MobileDetailPage = () => {
  const params = useParams()

  return <MobileDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(MobileDetailPage)