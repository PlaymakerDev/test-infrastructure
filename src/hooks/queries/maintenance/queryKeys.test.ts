import { describe, expect, it } from 'vitest'
import type { MaintenanceHistoryParams } from '@/types/maintenance'
import { maintenanceKeys } from './queryKeys'

describe('maintenanceKeys.history', () => {
  it('changes when any server-side history filter changes', () => {
    const base: MaintenanceHistoryParams = {
      status: 'open',
      region_id: 1,
      department_id: 2,
      road_code: 'ทด.1001',
      warranty: 'in',
      category: 'camera',
      search: 'CASE-1',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    }
    const baseKey = maintenanceKeys.history(base)
    const variants: MaintenanceHistoryParams[] = [
      { ...base, status: 'closed' },
      { ...base, region_id: 9 },
      { ...base, department_id: 8 },
      { ...base, road_code: 'ทด.2002' },
      { ...base, warranty: 'out' },
      { ...base, category: 'lighting' },
      { ...base, search: 'CASE-2' },
      { ...base, date_from: '2026-02-01' },
      { ...base, date_to: '2026-02-28' },
    ]

    for (const variant of variants) {
      expect(maintenanceKeys.history(variant)).not.toEqual(baseKey)
    }
  })
})
