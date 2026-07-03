import { useMutation, useQueryClient } from '@tanstack/react-query'
import { putVMSSettingTypeAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'

export function usePutVMSSettingType() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof putVMSSettingTypeAPI>[1] }) =>
      putVMSSettingTypeAPI(id, data),
    onSuccess: async () => {
      message.success('แก้ไขประเภทสำเร็จ')
      await qc.invalidateQueries({ queryKey: controlVmsKeys.settingTypes() })
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการแก้ไขประเภท')
      } else {
        message.error('เกิดข้อผิดพลาดในการแก้ไขประเภท')
      }
    },
  })
}
