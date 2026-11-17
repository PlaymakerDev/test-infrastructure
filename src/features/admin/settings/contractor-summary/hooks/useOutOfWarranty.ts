import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { manageKeys } from '@/hooks/queries/manage'
import {
  getOutOfWarrantyCandidatesAPI,
  getOutOfWarrantyProjectsAPI,
  getOutOfWarrantyRecordsAPI,
  postUploadOutOfWarrantyAPI,
  putOutOfWarrantyRecordsAPI,
} from '@/services/routes/ManageService'
import type { APIRequestProjectDeviceStatusList, OutOfWarrantyRecordRequest } from '@/types/manage/device-status-api'
import type { RecordToSave } from '../data/outOfWarranty'

/** อุปกรณ์นอกเหนือการค้ำประกัน's reads and its save (BE 2026-11-16). */

const PAGE_LIMIT = 100
const toIdSet = (ids: number[]) => new Set(ids)

/** One page of the contractor's projects with records — the
 *  นอกเหนือการรับประกัน tab's table (the backend lists those projects only,
 *  each with just its recorded devices). */
export const useOutOfWarrantyProjects = (params: APIRequestProjectDeviceStatusList, enabled: boolean) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.outOfWarranty.projects(params),
    queryFn: () =>
      getOutOfWarrantyProjectsAPI({ contractor_id: params.contractor_id, search: params.search, page: params.page, limit: params.limit })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: enabled && !!params.contractor_id,
  })

/** Every project of the contractor with a record — their button is blue
 *  whatever the tab (user 2026-11-16: the backend filters them). */
export const useOutOfWarrantyProjectIds = (contractorUserId: string) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.outOfWarranty.projectIds(contractorUserId),
    queryFn: async () => {
      const ids: number[] = []
      for (let page = 1; ; page++) {
        const { data } = await getOutOfWarrantyProjectsAPI({ contractor_id: contractorUserId, page, limit: PAGE_LIMIT })
        const rows = data.res_data ?? []
        ids.push(...rows.map((row) => row.project_id))
        if (rows.length < PAGE_LIMIT || page >= (data.meta_data?.total_pages ?? page)) return ids
      }
    },
    select: toIdSet,
    enabled: !!contractorUserId,
  })

// The modal's reads: afresh on every open (nothing kept once it closes), and
// not again while it is open — the form starts from what they said.
const MODAL_READ = { gcTime: 0, refetchOnWindowFocus: false } as const

/** What the project can record (admin and contractor only). */
export const useOutOfWarrantyCandidates = (projectId: number, enabled: boolean) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.outOfWarranty.candidates(projectId),
    queryFn: () => getOutOfWarrantyCandidatesAPI(projectId).then((r) => r.data),
    enabled,
    ...MODAL_READ,
  })

/** The project's open records (every role). */
export const useOutOfWarrantyRecords = (projectId: number) =>
  useQuery({
    queryKey: manageKeys.deviceStatus.outOfWarranty.records(projectId),
    queryFn: () => getOutOfWarrantyRecordsAPI(projectId).then((r) => r.data ?? []),
    ...MODAL_READ,
  })

/** A photo once uploaded, so a retry after a failed save sends the same file
 *  rather than another copy. */
const uploaded = new WeakMap<File, string>()

const uploadPhoto = async (file: File): Promise<string> => {
  const done = uploaded.get(file)
  if (done) return done
  // The upload service keeps the name's extension and the record takes
  // .jpg / .jpeg / .png — lower-case it (a phone's "IMG_0001.JPG").
  const named = new File([file], file.name.replace(/\.[^.]+$/, (ext) => ext.toLowerCase()), { type: file.type })
  const form = new FormData()
  form.append('upload', named)
  const { data } = await postUploadOutOfWarrantyAPI(form)
  const url = data?.path?.trim()
  if (!url) throw new Error('อัปโหลดไม่สำเร็จ: ระบบไม่ส่งที่อยู่ไฟล์กลับมา')
  uploaded.set(file, url)
  return url
}

/** Why a save failed, for the message the form shows. */
export type SaveFailure =
  | { kind: 'upload' }
  | { kind: 'conflict' }
  | { kind: 'forbidden' }
  | { kind: 'invalid'; message: string }
  | { kind: 'other' }

export class OutOfWarrantySaveError extends Error {
  constructor(readonly failure: SaveFailure) {
    super(failure.kind)
  }
}

const failureOf = (error: unknown): SaveFailure => {
  if (!isAxiosError(error)) return { kind: 'other' }
  const status = error.response?.status
  if (status === 409) return { kind: 'conflict' }
  if (status === 403) return { kind: 'forbidden' }
  if (status === 400) {
    const data = error.response?.data as { res_data?: { message?: string } | string } | undefined
    const message = typeof data?.res_data === 'string' ? data.res_data : data?.res_data?.message
    return { kind: 'invalid', message: message ?? '' }
  }
  return { kind: 'other' }
}

/** บันทึก: the new photos up first, then the whole list as the project's
 *  records (PUT — a device left out has its record closed). Refreshes every
 *  read of the page, the rings included, however it ends. */
export const useSaveOutOfWarranty = (projectId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (records: RecordToSave[]) => {
      let items: OutOfWarrantyRecordRequest[]
      try {
        items = await Promise.all(
          records.map(async (record) => ({
            project_id: projectId,
            ...(record.cameraId ? { camera_id: record.cameraId } : { solution_id: record.solutionId }),
            inspection_result: record.inspectionResult,
            images: await Promise.all(record.photos.map((photo) => (typeof photo === 'string' ? photo : uploadPhoto(photo)))),
          })),
        )
      } catch {
        throw new OutOfWarrantySaveError({ kind: 'upload' })
      }
      try {
        return (await putOutOfWarrantyRecordsAPI(projectId, items)).data
      } catch (error) {
        throw new OutOfWarrantySaveError(failureOf(error))
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: manageKeys.deviceStatus.all }),
  })
}
