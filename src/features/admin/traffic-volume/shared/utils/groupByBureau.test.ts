import { describe, expect, it } from 'vitest'
import { countDistinctProjects, groupByBureau, projectKey } from './groupByBureau'

interface Row {
  id: string
  bureau: string
  roadCode: string
  projectId?: string
  contractNo?: string
}

const row = (id: string, bureau: string, roadCode: string, projectId?: string, contractNo?: string): Row =>
  ({ id, bureau, roadCode, projectId, contractNo })

const keyOf = (r: Row) => projectKey(r.projectId, r.contractNo)

describe('projectKey', () => {
  it('picks the first non-empty candidate, trimming blanks', () => {
    expect(projectKey('12', 'คค 1/68')).toBe('12')
    expect(projectKey(undefined, 'คค 1/68')).toBe('คค 1/68')
    expect(projectKey('', '  ', 'คค 1/68')).toBe('คค 1/68')
    expect(projectKey(0, 'คค 1/68')).toBe('0') // numeric 0 is a real id, not "empty"
    expect(projectKey(null, undefined, '')).toBeUndefined()
  })
})

describe('countDistinctProjects', () => {
  it('counts distinct project identities, not rows', () => {
    // ปท.3010 จุดที่ 1 + จุดที่ 2 share one contract → 1 project
    const items = [
      row('s1', 'ขทช.ปทุมธานี', 'ปท.3010', 'p1', 'คค 0709/29/2567'),
      row('s2', 'ขทช.ปทุมธานี', 'ปท.3010', 'p1', 'คค 0709/29/2567'),
      row('s3', 'ขทช.ปทุมธานี', 'ปท.3010', 'p2', 'คค 0709/15/2568'),
    ]
    expect(countDistinctProjects(items, keyOf)).toBe(2)
  })

  it('falls back to contractNo when projectId is missing', () => {
    const items = [
      row('s1', 'b', 'r1', undefined, 'คค 9/68'),
      row('s2', 'b', 'r2', undefined, 'คค 9/68'),
    ]
    expect(countDistinctProjects(items, keyOf)).toBe(1)
  })

  it('counts identity-less rows individually (never collapses them together)', () => {
    const items = [row('s1', 'b', 'r1'), row('s2', 'b', 'r2'), row('s3', 'b', 'r3', 'p1')]
    expect(countDistinctProjects(items, keyOf)).toBe(3)
  })
})

describe('groupByBureau', () => {
  const projects = [
    row('s1', 'ขทช.ปทุมธานี', 'ปท.3004', 'p-3004', 'คค 0709/55/2568'),
    row('s2', 'ขทช.ปทุมธานี', 'ปท.3010', 'p-a', 'คค 0709/29/2567'),
    row('s3', 'ขทช.ปทุมธานี', 'ปท.3010', 'p-a', 'คค 0709/29/2567'),
    row('s4', 'ขทช.ปทุมธานี', 'ปท.3010', 'p-b', 'คค 0709/15/2568'),
    row('s5', 'ขทช.นนทบุรี', 'นบ.1001', 'p-c', 'คค 1/68'),
  ]

  it('bureau header count = distinct projects; project rows stay per install point', () => {
    const out = groupByBureau(projects, keyOf)
    const headers = out.filter((r) => r.kind === 'bureau')
    const rows = out.filter((r) => r.kind === 'project')
    expect(headers).toHaveLength(2)
    expect(headers[0]).toMatchObject({ bureau: 'ขทช.ปทุมธานี', count: 3 }) // 4 rows → 3 projects
    expect(headers[1]).toMatchObject({ bureau: 'ขทช.นนทบุรี', count: 1 })
    expect(rows).toHaveLength(5) // row rendering is untouched by the count fix
  })

  it('keeps road-code rowspans unchanged', () => {
    const out = groupByBureau(projects, keyOf)
    const spans = out.flatMap((r) => (r.kind === 'project' ? [r.roadCodeSpan] : []))
    // ปท.3004 → 1; ปท.3010 run of 3 → [3, 0, 0]; นบ.1001 → 1
    expect(spans).toEqual([1, 3, 0, 0, 1])
  })

  it('preserves bureau insertion order', () => {
    const out = groupByBureau(projects, keyOf)
    expect(out[0]).toMatchObject({ kind: 'bureau', bureau: 'ขทช.ปทุมธานี' })
  })
})
