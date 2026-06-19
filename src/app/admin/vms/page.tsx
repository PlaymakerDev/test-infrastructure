export const dynamic = "force-dynamic";
import React from 'react'
import VMSScreen from '@/features/admin/vms/overall/screen'

interface Props { }

const VMSPage: React.FC<Props> = () => {
  return <VMSScreen />
}

export default React.memo(VMSPage)
