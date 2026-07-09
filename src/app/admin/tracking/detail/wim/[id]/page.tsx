"use client"
import React from 'react'
import WIMDetailScreen from '@/features/admin/tracking/detail/wim/screen'
import { useParams, notFound } from 'next/navigation'

const WIMDetailPage = () => {
  const params = useParams()

  if (!params.id) notFound()

  return <WIMDetailScreen id={params.id} />
}

export default React.memo(WIMDetailPage)