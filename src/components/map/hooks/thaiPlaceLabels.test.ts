import { describe, expect, it } from 'vitest'
import { ungatePitch } from './thaiPlaceLabels'

// `ungatePitch` may only drop a clause that is provably `true` at the pitch it
// reports, and must refuse anything it can't prove — the copy then keeps the
// full (slow but correct) filter. Fixtures are Standard's own place-label
// filters as served by the live style (2026-10-02).

const gate = (limit: number, d: number) =>
  ['case', ['<=', ['pitch'], limit], true, ['<=', ['distance-from-center'], d]]

const COUNTRY = [
  'all',
  ['match', ['get', 'class'], ['country', 'disputed_country'],
    ['case', ['has', '$localized'], true, ['match', ['get', 'worldview'], ['all', 'US'], true, false]], false],
  gate(45, 2),
]

const SUBDIVISION = [
  'all',
  ['match', ['get', 'class'], ['disputed_settlement_subdivision', 'settlement_subdivision'],
    ['case', ['has', '$localized'], true, ['match', ['get', 'worldview'], ['all', 'US'], true, false]], false],
  ['<=', ['number', ['get', 'filterrank']], 3],
  gate(45, 1.5),
]

describe('ungatePitch', () => {
  it('replaces the pitch gate with true and reports its limit', () => {
    const r = ungatePitch(COUNTRY)
    expect(r).not.toBeNull()
    expect(r!.limit).toBe(45)
    expect(r!.filter).toEqual([...COUNTRY.slice(0, 2), true])
  })

  it('leaves every other clause untouched', () => {
    const r = ungatePitch(SUBDIVISION)!
    expect((r.filter as unknown[]).slice(0, 3)).toEqual(SUBDIVISION.slice(0, 3))
    expect((r.filter as unknown[])[3]).toBe(true)
  })

  it('reports the lowest limit when gates are nested', () => {
    const r = ungatePitch(['all', gate(60, 2), ['any', gate(40, 1), ['==', ['get', 'class'], 'x']]])!
    expect(r.limit).toBe(40)
    expect(JSON.stringify(r.filter)).not.toMatch(/pitch|distance-from-center/)
  })

  it('returns null when there is no gate', () => {
    expect(ungatePitch(['==', ['get', 'class'], 'continent'])).toBeNull()
  })

  it('refuses camera expressions in any other shape', () => {
    // distance-from-center outside a recognised gate
    expect(ungatePitch(['all', gate(45, 2), ['<=', ['distance-from-center'], 3]])).toBeNull()
    // gate whose "true" branch is not literally true
    expect(ungatePitch(['case', ['<=', ['pitch'], 45], ['has', 'x'], false])).toBeNull()
    // pitch compared the other way round
    expect(ungatePitch(['case', ['>', ['pitch'], 45], false, true])).toBeNull()
  })
})
