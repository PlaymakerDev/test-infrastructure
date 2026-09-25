import { useMutation } from '@tanstack/react-query'
import { postUploadProjectDocumentAPI } from '@/services/routes/ManageService'

/** Uploads one "เอกสารเชื่อมต่อระบบ" PDF and returns the service response. */
export const useUploadProjectDocument = () =>
  useMutation({
    mutationFn: (form: FormData) => postUploadProjectDocumentAPI(form),
  })
