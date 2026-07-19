"use client"
import { Suspense } from 'react'
import VMSCommandCenterScreen from '@/features/admin/vms-command-center/screen'

export default function ControlVMS() {
  return (
    <Suspense fallback={null}>
      <VMSCommandCenterScreen />
    </Suspense>
  )
}
