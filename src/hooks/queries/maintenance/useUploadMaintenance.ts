import { useMutation } from '@tanstack/react-query'
import { postUploadMaintenanceAPI } from '@/services/routes/MaintenanceService'

/** Uploads before/after repair media and returns the service response. */
export const useUploadMaintenance = () =>
  useMutation({
    mutationFn: (form: FormData) => postUploadMaintenanceAPI(form),
  })
