import { QueryClient } from '@tanstack/react-query'
import { controlVmsKeys } from '../data/queryKeys'

export async function invalidateVmsMediaWrites(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: controlVmsKeys.media() }),
    qc.invalidateQueries({ queryKey: controlVmsKeys.upcomingSummary() }),
    qc.invalidateQueries({ queryKey: controlVmsKeys.settingByRoad() }),
    qc.invalidateQueries({ queryKey: controlVmsKeys.schedule() }),
    qc.invalidateQueries({ queryKey: controlVmsKeys.settingList() }),
  ])
}
