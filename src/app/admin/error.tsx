"use client"
import { Button, Result } from 'antd'
import React from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

const AdminError: React.FC<Props> = ({ error, reset }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Result
        status="500"
        title="เกิดข้อผิดพลาด"
        subTitle={error.message || 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'}
        extra={
          <Button type="primary" shape="round" onClick={reset}>
            ลองใหม่
          </Button>
        }
      />
    </div>
  )
}

export default AdminError
