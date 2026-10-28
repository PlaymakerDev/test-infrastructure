import { describe, expect, it } from 'vitest'
import { joinRoadCodes, mergeSolutionRows } from './mergeSolutionRows'

type Row = { solution: { id: number }; road: string; cameras: number }
const row = (id: number, road: string, cameras: number): Row => ({ solution: { id }, road, cameras })
const tree = (...departments: Row[][]) => [{ name: 'สำนัก', sub_department: departments.map((solutions, i) => ({ name: `แขวง ${i}`, solutions })) }]
const merge = (into: Row, other: Row): Row => ({ ...into, road: joinRoadCodes(into.road, other.road), cameras: into.cameras + other.cameras })

describe('mergeSolutionRows', () => {
  it('folds an install point’s later rows into its first, which keeps its place', () => {
    const merged = mergeSolutionRows(tree([row(520, 'สต.3005', 2), row(7, 'สต.1', 1), row(520, 'สต.3016', 1)]), merge)
    expect(merged[0].sub_department[0].solutions).toEqual([row(520, 'สต.3005, สต.3016', 3), row(7, 'สต.1', 1)])
  })

  it('across departments too — the later department loses the row', () => {
    const merged = mergeSolutionRows(tree([row(964, 'นม.1016', 2)], [row(964, 'นม.3052', 2), row(8, 'นม.1', 1)]), merge)
    expect(merged[0].sub_department.map((sub) => sub.solutions)).toEqual([[row(964, 'นม.1016, นม.3052', 4)], [row(8, 'นม.1', 1)]])
  })

  it('a tree with one row per install point comes back as it was', () => {
    const one = tree([row(1, 'ก', 1), row(2, 'ข', 2)], [row(3, 'ค', 3)])
    expect(mergeSolutionRows(one, merge)).toEqual(one)
  })
})

describe('joinRoadCodes', () => {
  it('lists each road once, in the order met', () => {
    expect(joinRoadCodes('สต.3005', 'สต.3016')).toBe('สต.3005, สต.3016')
    expect(joinRoadCodes('สต.3005, สต.3016', 'สต.3005')).toBe('สต.3005, สต.3016')
    expect(joinRoadCodes('', 'สต.3016')).toBe('สต.3016')
  })
})
