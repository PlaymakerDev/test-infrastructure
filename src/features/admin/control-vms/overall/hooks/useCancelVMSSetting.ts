import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelVMSSettingAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

// Cancels an in-flight VMS command mid-way (backend flips status→6). Invalidates
// every list/history query so status pills refresh immediately without waiting
// for the next 5-second poll.
export function useCancelVMSSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settingID: number) => cancelVMSSettingAPI(settingID),
    onSuccess: (_res, settingID) => {
      qc.invalidateQueries({ queryKey: controlVmsKeys.all })
      qc.invalidateQueries({ queryKey: controlVmsKeys.historyBySetting(settingID) })
      qc.invalidateQueries({ queryKey: controlVmsKeys.history() })
    },
  })
}
