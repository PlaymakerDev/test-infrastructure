import { Button, Result } from 'antd'
import Link from 'next/link'
import React from 'react'

const AdminNotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Result
        status="404"
        title="404"
        subTitle="ไม่พบหน้าที่คุณต้องการ"
        extra={
          <Link href="/admin/dashboard">
            <Button type="primary" shape="round">
              กลับหน้าหลัก
            </Button>
          </Link>
        }
      />
    </div>
  )
}

export default AdminNotFound
