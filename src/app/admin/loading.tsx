import { Spin } from 'antd'
import React from 'react'

const AdminLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spin size="large" description="กำลังโหลด..." />
    </div>
  )
}

export default AdminLoading
