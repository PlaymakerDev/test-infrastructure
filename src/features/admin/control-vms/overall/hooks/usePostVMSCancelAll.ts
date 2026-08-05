import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSMediaBatchDeleteAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

/** Bulk "ยกเลิกคำสั่งทั้งหมด" (STATUS tab toolbar) — one batch-delete call
 *  whose schedule_ids span MANY settings (the endpoint deletes by schedule id;
 *  it is not scoped to a single setting). Mirrors usePostVMSBatchDelete's
 *  toast/error/invalidation shape, but invalidates every touched setting's
 *  mediaDetail instead of a single one. */
export function usePostVMSCancelAll() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schedule_ids }: { schedule_ids: number[]; setting_ids: (string | number)[] }) =>
      postVMSMediaBatchDeleteAPI({ schedule_ids }),
    onSuccess: async (_, variables) => {
      message.success('ยกเลิกคำสั่งสำเร็จ')
      for (const id of variables.setting_ids) {
        qc.invalidateQueries({ queryKey: controlVmsKeys.mediaDetail(id) })
      }
      await invalidateVmsMediaWrites(qc)
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการยกเลิกคำสั่ง')
      } else {
        message.error('เกิดข้อผิดพลาดในการยกเลิกคำสั่ง')
      }
    },
  })
}
