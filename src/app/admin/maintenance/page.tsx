"use client"
import React, { Suspense } from 'react'
import MaintenanceScreen from '@/features/admin/maintenance/screen'

const MaintenancePage = () => {
  return (
    <Suspense>
      <MaintenanceScreen />
    </Suspense>
  )
}

export default React.memo(MaintenancePage)
