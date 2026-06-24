import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSMediaAPI } from '@/services/routes/ControlVMSService'
import { message } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'

export function usePostVMSMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postVMSMediaAPI,
    onSuccess: async () => {
      message.success('บันทึกข้อมูลสำเร็จ')
      await Promise.all([
        qc.invalidateQueries({ queryKey: controlVmsKeys.settingTypes() }),
        qc.invalidateQueries({ queryKey: controlVmsKeys.media() }),
      ])
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
