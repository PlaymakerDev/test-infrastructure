import { describe, expect, it } from 'vitest'
import { gateOn, ungatePitch } from './thaiPlaceLabels'

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

describe('gateOn', () => {
  const W = ['within', { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } }]

  it('wraps a plain expression', () => {
    const text = ['coalesce', ['get', 'name_en'], ['get', 'name']]
    expect(gateOn(text, W)).toEqual(['case', W, text, ''])
  })

  it('pushes the condition into each output of a zoom step, leaving the stops', () => {
    const icon = ['step', ['zoom'], 'dot-9', 8, 'dot-10', 13, 'border-dot-13']
    expect(gateOn(icon, W)).toEqual(['step', ['zoom'],
      ['case', W, 'dot-9', ''], 8, ['case', W, 'dot-10', ''], 13, ['case', W, 'border-dot-13', '']])
  })

  it('keeps let bindings and gates only the body (Standard icon-image shape)', () => {
    const icon = ['let', 'h', ['at', 0, ['to-hsla', 'hsl(0, 0%, 0%)']], ['step', ['zoom'], 'a', 9, 'b']]
    expect(gateOn(icon, W)).toEqual(['let', 'h', ['at', 0, ['to-hsla', 'hsl(0, 0%, 0%)']],
      ['step', ['zoom'], ['case', W, 'a', ''], 9, ['case', W, 'b', '']]])
  })

  it('never leaves ["zoom"] under a case', () => {
    const icon = ['let', 'x', 1, ['step', ['zoom'], ['step', ['zoom'], 'a', 4, 'b'], 9, 'c']]
    const walk = (n: unknown, underCase: boolean): boolean =>
      Array.isArray(n) && (n.length === 1 && n[0] === 'zoom' ? underCase : n.some((c) => walk(c, underCase || n[0] === 'case')))
    expect(walk(gateOn(icon, W), false)).toBe(false)
  })

  it('leaves a non-zoom step alone and wraps it whole', () => {
    const e = ['step', ['get', 'symbolrank'], 'a', 6, 'b']
    expect(gateOn(e, W)).toEqual(['case', W, e, ''])
  })
})
