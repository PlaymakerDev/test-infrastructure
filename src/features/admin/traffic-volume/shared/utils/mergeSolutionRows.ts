// Folding an install point's several central/list rows into one — used by the
// overall pages whose backend groups its rows by the CAMERA's road.

/** The /overview/central/list tree: bureau → department → one row per install point. */
interface CentralTree<Row> {
  sub_department: { solutions: Row[] }[]
}

/**
 * The counting and analytic backends group a central/list row by the road each
 * camera stands on (`tc.road_id`) and the install point's name, so an install
 * point whose cameras sit on two roads comes back as two rows — in one
 * department, or in two when those roads belong to different ones. Each row
 * counts only its own cameras, so the rows add up: fold every later row of an
 * install point into its first one with `merge`, which keeps the first one's
 * place in the tree. Dropping the later rows instead lost cameras (traffic
 * volume 520 showed 2 of its 3, incident detection 964 showed 2 of 4 —
 * 2026-10-28). Once the backend returns one row per install point there is
 * nothing to fold and the tree comes back as it was.
 */
export function mergeSolutionRows<Row extends { solution: { id: number | string } }, Item extends CentralTree<Row>>(
  bureaus: Item[],
  merge: (into: Row, row: Row) => Row,
): Item[] {
  const merged = new Map<number | string, Row>()
  for (const bureau of bureaus) {
    for (const sub of bureau.sub_department ?? []) {
      for (const row of sub.solutions ?? []) {
        const into = merged.get(row.solution.id)
        merged.set(row.solution.id, into ? merge(into, row) : row)
      }
    }
  }
  const placed = new Set<number | string>()
  // The same tree with its rows swapped, so the cast only restores the caller's
  // own bureau / department types.
  return bureaus.map((bureau) => ({
    ...bureau,
    sub_department: (bureau.sub_department ?? []).map((sub) => ({
      ...sub,
      solutions: (sub.solutions ?? []).flatMap((row) => {
        if (placed.has(row.solution.id)) return []
        placed.add(row.solution.id)
        return [merged.get(row.solution.id) ?? row]
      }),
    })),
  })) as Item[]
}

/** "สต.3005" + "สต.3016" → "สต.3005, สต.3016" — every road a merged row's
 *  cameras stand on, each once. Search still finds each code (it matches road
 *  codes token by token). */
export const joinRoadCodes = (codes: string, code: string): string =>
  [...new Set([...codes.split(', '), code].filter(Boolean))].join(', ')
