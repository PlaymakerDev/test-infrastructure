"use client"
import React from 'react'
import CrosswalkDetailScreen from '@/features/admin/crosswalk/detail/screen'
import { useParams } from 'next/navigation'

const CrosswalkDetailPage = () => {
  const params = useParams()

  return <CrosswalkDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(CrosswalkDetailPage)