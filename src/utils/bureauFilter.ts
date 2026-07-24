import type { BureauItem, BureauState, BureauRoute } from '@/types/control-vms/bureau'

// Shared by control-vms's legacy SearchSection and Command Center's
// ScopePicker sidebar — keeps sign search behaving identically everywhere
// a BureauItem tree gets filtered by name/code.
export function filterBureauData(data: BureauItem[], term: string): BureauItem[] {
  const t = term.toLowerCase()
  if (!t) return data

  return data.reduce<BureauItem[]>((acc, bureau) => {
    if (bureau.department_short_name.toLowerCase().includes(t)) {
      acc.push(bureau)
      return acc
    }

    const filteredStates = (bureau.sub_department ?? []).reduce<BureauState[]>((sacc, state) => {
      if (state.department_short_name.toLowerCase().includes(t)) {
        sacc.push(state)
        return sacc
      }

      const filteredRoads = (state.roads ?? []).reduce<BureauRoute[]>((racc, road) => {
        if (road.road_name.toLowerCase().includes(t) || road.road_code.toLowerCase().includes(t)) {
          racc.push(road)
          return racc
        }

        const filteredSigns = (road.solution ?? []).filter(sign =>
          sign.solution_name.toLowerCase().includes(t)
        )
        if (filteredSigns.length > 0) racc.push({ ...road, solution: filteredSigns })

        return racc
      }, [])

      if (filteredRoads.length > 0) sacc.push({ ...state, roads: filteredRoads })
      return sacc
    }, [])

    if (filteredStates.length > 0) acc.push({ ...bureau, sub_department: filteredStates })
    return acc
  }, [])
}
