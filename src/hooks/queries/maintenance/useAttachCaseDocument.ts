import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attachMaintenanceCaseDocumentAPI, postUploadMaintenanceAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** นำเข้าหนังสือแจ้งซ่อมพร้อมลายเซ็น — uploads the signed PDF, then attaches
 *  it to the case.
 *
 *  The upload goes to `/upload/maintenance`, next to the case's other files
 *  (before/after photos, device-status sheet): every /maintenance/case file
 *  lives in /images/maintenance, which needs no signed link (user confirmed
 *  2026-09-29), so the plain link the upload returns is stored as-is. NOT
 *  `/upload/project`: that folder only opens with a signed link (`?exp=&sig=`,
 *  ~10 min) and GET /maintenance/case hands the stored link back unsigned — a
 *  letter stored there got 403 ten minutes after it was attached (2026-09-28).
 *
 *  Attaching opens a waiting_doc case (the contractor sees it from then on), so
 *  every read that lists cases or their status is refreshed. */
export const useAttachCaseDocument = (caseNo: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('upload', file)
      const uploaded = await postUploadMaintenanceAPI(form)
      const documentUrl = uploaded.data?.path?.trim()
      if (!documentUrl) throw new Error('อัปโหลดไม่สำเร็จ: ระบบไม่ส่งที่อยู่ไฟล์กลับมา')
      const attached = await attachMaintenanceCaseDocumentAPI(caseNo, {
        document_url: documentUrl,
        file_name: file.name,
      })
      return attached.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.case(caseNo) })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'solution'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'cases'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'history'] })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.warrantySummary() })
    },
  })
}
