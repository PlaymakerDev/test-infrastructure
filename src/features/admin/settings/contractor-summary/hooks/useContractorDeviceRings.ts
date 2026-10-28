import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getContractorUptimeAPI } from '@/services/routes/ManageService'
import { manageKeys } from '@/hooks/queries/manage'
import type { ContractorData } from '@/types/manage/contractor-api'
import type { DeviceTotals } from '@/types/manage/device-status-api'
import { SUMMARY_SYSTEMS, type SummarySystem } from '../data/systems'
import { hasDevices, readUptimeTotals, warrantyParam, type WarrantyFilter } from '../data/deviceStatus'

export interface DeviceRing {
  system: SummarySystem
  totals: DeviceTotals
}

/** The rings of "ภาพรวมสถานะการทำงานของอุปกรณ์ทุกโครงการ": each system's
 *  uptime-statistics filtered to the contractor (user_id), nationwide, under
 *  the page's ทั้งหมด / ในค้ำ / หมดค้ำ (user 2026-10-07: the rings follow it
 *  too). Only the systems the contractor has under that filter get a ring.
 *
 *  Tunnel included: its uptime-statistics used to ignore `contractor_id`, so
 *  the page counted it from the tunnel list itself; the backend honours
 *  `contractor_id` and `is_warranty` now (checked 2026-10-26 — the same
 *  totals as that count for every contractor with tunnels, all three filters). */
export const useContractorDeviceRings = (contractor: ContractorData | null | undefined, warranty: WarrantyFilter) => {
  const userId = contractor?.user_id ?? ''
  const isWarranty = warrantyParam(warranty)

  const uptime = useQueries({
    queries: SUMMARY_SYSTEMS.map((system) => ({
      queryKey: manageKeys.deviceStatus.uptime(userId, system.prefix, isWarranty),
      queryFn: () =>
        getContractorUptimeAPI(system.prefix, userId, isWarranty).then((r) => readUptimeTotals(system.block, r.data)),
      enabled: !!userId,
    })),
  })

  const rings = useMemo(
    () =>
      SUMMARY_SYSTEMS.flatMap((system, index): DeviceRing[] => {
        const totals = uptime[index]?.data ?? null
        return hasDevices(totals) ? [{ system, totals }] : []
      }),
    [uptime],
  )

  const isLoading = !contractor || uptime.some((query) => query.isLoading)
  // A failed system just goes without its ring; only all of them failing is an error.
  const isError = uptime.length > 0 && uptime.every((query) => query.isError)

  return { rings, isLoading, isError }
}
