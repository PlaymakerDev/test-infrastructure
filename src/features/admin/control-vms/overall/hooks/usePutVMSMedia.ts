import { useMutation, useQueryClient } from '@tanstack/react-query'
import { putVMSMediaAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

export function usePutVMSMedia() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof putVMSMediaAPI>[1] }) =>
      putVMSMediaAPI(id, data),
    onSuccess: async () => {
      message.success('แก้ไขข้อมูลสำเร็จ')
      await invalidateVmsMediaWrites(qc)
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
      } else {
        message.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
      }
    },
  })
}
