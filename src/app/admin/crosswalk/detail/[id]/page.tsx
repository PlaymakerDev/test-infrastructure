"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import CrosswalkDetailScreen from '@/features/admin/crosswalk/detail/screen'

const CrosswalkDetailPage = () => {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  return <CrosswalkDetailScreen id={id} />
}

export default React.memo(CrosswalkDetailPage)
