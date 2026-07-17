import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { AxiosError } from 'axios'
import { postOpenBridgeLightingAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

/** Sends the remote open/close command, then invalidates every scope/id
 *  variant of the shelly-status + pm-chart reads (prefix-only keys — see
 *  control-vms's `invalidateVmsMediaWrites` for the same pattern) so the
 *  detail screen picks up the new device state without a manual refresh. */
export const usePostOpenBridgeLighting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postOpenBridgeLightingAPI,
    onSuccess: () => {
      message.success('ส่งคำสั่งเปิด-ปิดไฟประดับสะพานเรียบร้อยแล้ว')
      queryClient.invalidateQueries({ queryKey: bridgeLightingDetailKeys.shellyStatus() })
      queryClient.invalidateQueries({ queryKey: bridgeLightingDetailKeys.pmChart() })
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? error.message)
      } else {
        message.error('เกิดข้อผิดพลาดในการส่งคำสั่งเปิด-ปิดไฟประดับสะพาน')
      }
    },
  })
}
