"use client"
import React, { Suspense } from 'react'
import IncidentDetailScreen from '@/features/admin/statistics/detail/incident/screen'

export default function IncidentDetailPage() {
  return (
    <Suspense>
      <IncidentDetailScreen />
    </Suspense>
  )
}
