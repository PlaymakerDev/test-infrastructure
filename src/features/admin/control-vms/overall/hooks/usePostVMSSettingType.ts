import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postVMSSettingTypeAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'

export function usePostVMSSettingType() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postVMSSettingTypeAPI,
    onSuccess: async () => {
      message.success('เพิ่มประเภทสำเร็จ')
      await qc.invalidateQueries({ queryKey: controlVmsKeys.settingTypes() })
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการเพิ่มประเภท')
      } else {
        message.error('เกิดข้อผิดพลาดในการเพิ่มประเภท')
      }
    },
  })
}
