import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { manageKeys } from '@/hooks/queries/manage'
import { fetchAllPages } from '@/features/admin/settings/overall/utils/fetchAllPages'
import { getProjectDeviceStatusListAPI, getProjectDeviceSummaryListAPI } from '@/services/routes/ManageService'
import type { APIRequestProjectDeviceStatusList } from '@/types/manage/device-status-api'
import { listedById, statusTableRow, type ProjectStatusTableRow } from '../data/statusTable'

const NO_ROWS: ProjectStatusTableRow[] = []

/** ทั้งหมด / ในค้ำ / หมดค้ำ's page of projects (user 2026-11-17: Traffic
 *  Signal, Bridge Lighting, Crosswalk and Tunnel too). The page is
 *  /device-status/summary's — every system counted, and every project: the
 *  plain list leaves out one with nothing under CCTV, VMS or Street Light
 *  (เฟิร์สเทค's 521: a junction's three controllers, 2026-11-17). Each
 *  project's cameras, VMS and street lights come from the plain list, read
 *  whole under the same filters (it answers in well under a second) — CCTV
 *  stays every camera of the project, the ones its ▷▷ opens. */
export const useContractorStatusRows = (params: APIRequestProjectDeviceStatusList, enabled: boolean) => {
  const summary = useQuery({
    queryKey: manageKeys.deviceStatus.summaryPage(params),
    queryFn: () => getProjectDeviceSummaryListAPI(params).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled,
  })
  const filters = { contractor_id: params.contractor_id, is_warranty: params.is_warranty, search: params.search }
  const listed = useQuery({
    queryKey: manageKeys.deviceStatus.listAll(filters),
    queryFn: () => fetchAllPages((page, limit) => getProjectDeviceStatusListAPI({ ...filters, page, limit }).then((r) => r.data)),
    select: listedById,
    placeholderData: keepPreviousData,
    enabled,
  })
  const rows = useMemo(
    () => (summary.data && listed.data ? (summary.data.res_data ?? []).map((row) => statusTableRow(row, listed.data.get(row.project_id))) : NO_ROWS),
    [summary.data, listed.data],
  )
  return {
    rows,
    total: summary.data?.meta_data?.count ?? 0,
    isLoading: summary.isLoading || listed.isLoading,
    /** The previous page (or filter) still on screen while the next loads. */
    isPlaceholderData: summary.isPlaceholderData || listed.isPlaceholderData,
    isError: summary.isError || listed.isError,
  }
}
