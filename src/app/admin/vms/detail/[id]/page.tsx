"use client"
import React from 'react'
import VMSDetailScreen from '@/features/admin/vms/detail/screen'
import { useParams } from 'next/navigation'

const VMSDetailPage = () => {
  const params = useParams()

  return <VMSDetailScreen id={params.id || 'ID_NOT_FOUND'} />
}

export default React.memo(VMSDetailPage)
