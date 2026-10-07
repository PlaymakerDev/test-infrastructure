import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getContractorUptimeAPI, getProjectDeviceStatusListAPI } from '@/services/routes/ManageService'
import { manageKeys } from '@/hooks/queries/manage'
import { useTunnelCentralList } from '@/hooks/queries/tunnel/useTunnelCentralList'
import type { ContractorData } from '@/types/manage/contractor-api'
import type { DeviceTotals } from '@/types/manage/device-status-api'
import { SUMMARY_SYSTEMS, TUNNEL_SOLUTION_TYPE_ID, type SummarySystem } from '../data/systems'
import { hasDevices, readUptimeTotals, tunnelTotalsFor, warrantyParam, type WarrantyFilter } from '../data/deviceStatus'

export interface DeviceRing {
  system: SummarySystem
  totals: DeviceTotals
}

const UPTIME_SYSTEMS = SUMMARY_SYSTEMS.filter((system) => system.key !== 'tunnel')
const PAGE_LIMIT = 100

/** Every project id of one contractor — the device-status list, all pages. */
const fetchContractorProjectIds = async (contractorUserId: string): Promise<number[]> => {
  const ids: number[] = []
  for (let page = 1; ; page++) {
    const { data } = await getProjectDeviceStatusListAPI({ contractor_id: contractorUserId, page, limit: PAGE_LIMIT })
    const rows = data.res_data ?? []
    ids.push(...rows.map((row) => row.project_id))
    if (rows.length < PAGE_LIMIT || page >= (data.meta_data?.total_pages ?? page)) return ids
  }
}

/** The rings of "ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ": each system's
 *  uptime-statistics filtered to the contractor (user_id), nationwide, under
 *  the page's ทั้งหมด / ในค้ำ / หมดค้ำ (user 2026-10-07: the rings follow it
 *  too). Only the systems the contractor has under that filter get a ring.
 *
 *  Tunnel is the exception: its uptime-statistics takes no `contractor_id` and
 *  answers everyone the same nationwide totals, so for a contractor whose
 *  solution_group lists Tunnel it is counted from the tunnel list instead —
 *  the tunnels on that contractor's projects. */
export const useContractorDeviceRings = (contractor: ContractorData | null | undefined, warranty: WarrantyFilter) => {
  const userId = contractor?.user_id ?? ''
  const isWarranty = warrantyParam(warranty)

  const uptime = useQueries({
    queries: UPTIME_SYSTEMS.map((system) => ({
      queryKey: manageKeys.deviceStatus.uptime(userId, system.prefix, isWarranty),
      queryFn: () =>
        getContractorUptimeAPI(system.prefix, userId, isWarranty).then((r) => readUptimeTotals(system.block, r.data)),
      enabled: !!userId,
    })),
  })

  const hasTunnel = !!contractor?.solution_group?.some((group) => group.id === TUNNEL_SOLUTION_TYPE_ID)
  const projectIds = useQuery({
    queryKey: manageKeys.deviceStatus.projectIds(userId),
    queryFn: () => fetchContractorProjectIds(userId),
    enabled: !!userId && hasTunnel,
  })
  // '0' (not 0): the hook only fires for a truthy department id.
  const tunnelCentral = useTunnelCentralList(hasTunnel ? '0' : null, { page: 1, limit: 100, scope: 'all' })

  const rings = useMemo(() => {
    const tunnel = hasTunnel && projectIds.data && tunnelCentral.data
      ? tunnelTotalsFor(tunnelCentral.data, new Set(projectIds.data), isWarranty)
      : null
    return SUMMARY_SYSTEMS.flatMap((system): DeviceRing[] => {
      const totals = system.key === 'tunnel'
        ? tunnel
        : uptime[UPTIME_SYSTEMS.indexOf(system)]?.data ?? null
      return hasDevices(totals) ? [{ system, totals }] : []
    })
  }, [uptime, hasTunnel, projectIds.data, tunnelCentral.data, isWarranty])

  const isLoading =
    !contractor ||
    uptime.some((query) => query.isLoading) ||
    (hasTunnel && (projectIds.isLoading || tunnelCentral.isLoading))
  // A failed system just goes without its ring; only all of them failing is an error.
  const isError = uptime.length > 0 && uptime.every((query) => query.isError)

  return { rings, isLoading, isError }
}
