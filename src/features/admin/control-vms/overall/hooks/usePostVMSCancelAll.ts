import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSSettingCancelAllAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { invalidateVmsMediaWrites } from './invalidateVmsMediaWrites'

/**
 * Bulk "ยกเลิกคำสั่งทั้งหมด" (STATUS tab toolbar) — one POST
 * /vms/settings/cancel-all carrying the signs to stop. The endpoint cancels
 * each sign's active commands AND its whole queue in a single transaction
 * (status → 6), so no next-in-queue command slides in; the sign stays blank
 * until a new command is dispatched. Replaced the old per-schedule
 * batch-delete call 2026-08-20 — schedule-level ticking can't express "stop
 * the queue too", which is what this button means.
 *
 * Also invalidates the Command Center's own keys: this STATUS tab is mounted
 * inside /admin/control-vms?tab=status, next to the live monitor.
 */
export function usePostVMSCancelAll() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vms_ids }: { vms_ids: number[] }) => postVMSSettingCancelAllAPI({ vms_ids }),
    onSuccess: async () => {
      message.success('ยกเลิกคำสั่งสำเร็จ')
      await invalidateVmsMediaWrites(qc)
      await qc.invalidateQueries({ queryKey: ['vms-command-center'] })
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
