import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSMediaAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

export function usePostVMSMedia() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postVMSMediaAPI,
    onSuccess: async () => {
      message.success('บันทึกข้อมูลสำเร็จ')
      await invalidateVmsMediaWrites(qc)
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      } else {
        message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      }
    },
  })
}
