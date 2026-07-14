"use client"
import React, { useCallback } from 'react'
import { Button, Modal } from 'antd'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import { useAppDispatch } from '@/stores/hooks'
import { resetDrawerOpen } from '@/stores/reducers/layout/layoutSlice'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
}

const SidebarFooter: React.FC<Props> = (props) => {
  const { } = props
  const [modal, contextHolder] = Modal.useModal()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  const onLogout = useCallback(async () => {
    try {
      const response = await axios.post(`${process.env.__NEXT_ROUTER_BASEPATH ?? ''}/api/auth/logout`, {})
      if (response.status === 200) {
        dispatch(resetDrawerOpen())
        // Drop this user's cached (token-scoped) data so the next login starts clean.
        queryClient.clear()

        modal.success({
          title: 'Logout successful',
          content: 'You have been logged out successfully.',
          onOk: () => router.push('/auth/login'),
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
  }, [modal, router, dispatch, queryClient])


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
