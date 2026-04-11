"use client"
import React, { useCallback } from 'react'
import { Button, Modal } from 'antd'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'

interface Props {
}

const SidebarFooter: React.FC<Props> = (props) => {
  const { } = props
  const [modal, contextHolder] = Modal.useModal()
  const router = useRouter()

  const onLogout = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/logout', {})
      if (response.status === 200) {
        modal.success({
          title: 'Logout successful',
          content: 'You have been logged out successfully.',
          onOk: () => router.push('/login'),
          onCancel: () => Modal.destroyAll(),
        })
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        modal.error({
          title: 'Logout failed',
          content: error.response?.data?.res_data?.message,
          onOk: () => Modal.destroyAll(),
          onCancel: () => Modal.destroyAll(),
        })
      }
    }
  }, [modal, router])


  return (
    <footer>
      <Button
        type='primary'
        size='large'
        block
        onClick={onLogout}
      >
        ออกจากระบบ
      </Button>
      {contextHolder}
    </footer>
  )
}

export default React.memo<Props>(SidebarFooter)
