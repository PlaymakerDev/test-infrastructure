import { describe, expect, it } from 'vitest'
import { fmtGreenTime, peakPhaseOf, phaseSeries, phasesFromRows } from './trafficSignals'

describe('phasesFromRows', () => {
  it('uses the phases the rows report, not the declared count', () => {
    // Declares 4, reports only phase 1 (solution 1606's PCU graph).
    expect(phasesFromRows([{ phases_no: 1 }, { phases_no: 1 }], 4)).toEqual([1])
    // Declares 0, reports 2–4 (solution 1611).
    expect(phasesFromRows([{ phases_no: 4 }, { phases_no: 2 }, { phases_no: 3 }], 0)).toEqual([2, 3, 4])
  })

  it('reads `phase_no` rows too (summary/phase_details shape)', () => {
    expect(phasesFromRows([{ phase_no: 2 }, { phase_no: 1 }])).toEqual([1, 2])
  })

  it('falls back to the declared count only when there are no rows', () => {
    expect(phasesFromRows([], 3)).toEqual([1, 2, 3])
    expect(phasesFromRows(null, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('draws nothing for an unconfigured (0-phase) junction without rows', () => {
    expect(phasesFromRows(undefined, 0)).toEqual([])
    expect(phasesFromRows([{ phases_no: 0 }, { phases_no: null }])).toEqual([])
  })
})

describe('phaseSeries', () => {
  it('keys each series p{n} with the shared phase color', () => {
    expect(phaseSeries([1, 5])).toEqual([
      { dataKey: 'p1', color: '#05F2DB', label: 'Phase 1' },
      { dataKey: 'p5', color: '#05F2DB', label: 'Phase 5' },
    ])
  })
})

describe('fmtGreenTime', () => {
  it('prints seconds, and a dash when the phase has no timing', () => {
    expect(fmtGreenTime(25)).toBe('25s')
    expect(fmtGreenTime(0)).toBe('0s')
    expect(fmtGreenTime(null)).toBe('-')
    expect(fmtGreenTime(undefined)).toBe('-')
  })
})

describe('peakPhaseOf', () => {
  const phases = [
    { phase_no: 2, pcu: 0 },
    { phase_no: 4, pcu: 7939.5 },
  ]
  it("keeps BE's peak when it sets one", () => {
    expect(peakPhaseOf({ peak_phase: 3, phases })).toBe(3)
  })
  it('falls back to the highest-PCU phase when BE reports 0 (solution 1611)', () => {
    expect(peakPhaseOf({ peak_phase: 0, phases })).toBe(4)
  })
  it('is 0 (no peak) when no phase carried traffic', () => {
    expect(peakPhaseOf({ peak_phase: 0, phases: [{ phase_no: 1, pcu: 0 }] })).toBe(0)
    expect(peakPhaseOf({ peak_phase: 0, phases: null })).toBe(0)
  })
})
