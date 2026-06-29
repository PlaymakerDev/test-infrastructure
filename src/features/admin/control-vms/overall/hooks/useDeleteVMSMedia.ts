import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteVMSMediaAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

export function useDeleteVMSMedia() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => deleteVMSMediaAPI(id),
    onSuccess: async (_, id) => {
      message.success('ลบข้อมูลสำเร็จ')
      qc.removeQueries({ queryKey: controlVmsKeys.mediaDetail(id) })
      await invalidateVmsMediaWrites(qc)
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบข้อมูล')
      } else {
        message.error('เกิดข้อผิดพลาดในการลบข้อมูล')
      }
    },
  })
}
