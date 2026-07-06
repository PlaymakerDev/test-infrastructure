import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSMediaBatchDeleteAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

export function usePostVMSBatchDelete() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schedule_ids }: { id: string | number; schedule_ids: number[] }) =>
      postVMSMediaBatchDeleteAPI({ schedule_ids }),
    onSuccess: async (_, variables) => {
      message.success('ลบข้อมูลสำเร็จ')
      qc.invalidateQueries({ queryKey: controlVmsKeys.mediaDetail(variables.id) })
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
