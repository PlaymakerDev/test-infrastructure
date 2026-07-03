import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteVMSSettingTypeAPI } from '@/services/routes/ControlVMSService'
import { App } from 'antd'
import { AxiosError } from 'axios'
import { controlVmsKeys } from '../data/queryKeys'

export function useDeleteVMSSettingType() {
  const { message } = App.useApp()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => deleteVMSSettingTypeAPI(id),
    onSuccess: async () => {
      message.success('ลบประเภทสำเร็จ')
      await qc.invalidateQueries({ queryKey: controlVmsKeys.settingTypes() })
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบประเภท')
      } else {
        message.error('เกิดข้อผิดพลาดในการลบประเภท')
      }
    },
  })
}
