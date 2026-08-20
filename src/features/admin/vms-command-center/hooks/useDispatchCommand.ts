import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { postVMSDispatchAPI } from '@/services/routes/ControlVMSService'
import { invalidateVmsMediaWrites } from '@/features/admin/control-vms/overall/hooks/invalidateVmsMediaWrites'
import type { APIRequestVMSDispatch } from '@/types/vms/command-center-api'

/**
 * Sends every ชุดคำสั่ง the composer built as one call (`settings[]` +
 * `vms_ids`). Invalidates both the legacy control-vms read keys (DISPLAY /
 * STATUS tabs) and the Command Center's own monitor/history keys so the live
 * monitor picks the new commands up on its next render rather than waiting out
 * its poll interval.
 */
export function useDispatchCommand() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: APIRequestVMSDispatch) => postVMSDispatchAPI(data),
    onSuccess: async () => {
      message.success('ส่งคำสั่งควบคุมเรียบร้อย')
      await invalidateVmsMediaWrites(qc)
      await qc.invalidateQueries({ queryKey: ['vms-command-center'] })
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'ส่งคำสั่งควบคุมไม่สำเร็จ')
      } else {
        message.error('ส่งคำสั่งควบคุมไม่สำเร็จ')
      }
    },
  })
}
