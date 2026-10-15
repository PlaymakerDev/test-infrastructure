import { describe, expect, it } from 'vitest'
import { trimOutlierCoords } from './trimOutlierCoords'

// สทช.12 (Songkhla / Pattani / Satun) — a realistic bureau-sized cluster.
const SONGKHLA: [number, number][] = [
  [100.59, 7.2],
  [100.47, 7.01],
  [101.25, 6.87],
  [100.07, 6.62],
  [101.8, 6.4],
  [100.9, 6.95],
]

describe('trimOutlierCoords', () => {
  it('drops a point far outside the cluster', () => {
    const chiangMai: [number, number] = [98.98, 18.79]
    expect(trimOutlierCoords([...SONGKHLA, chiangMai])).toEqual(SONGKHLA)
  })

  it('drops a placeholder [1,1] point', () => {
    expect(trimOutlierCoords([...SONGKHLA, [1, 1]])).toEqual(SONGKHLA)
  })

  it('keeps every point of a single cluster', () => {
    expect(trimOutlierCoords(SONGKHLA)).toEqual(SONGKHLA)
  })

  it('keeps a nationwide spread intact', () => {
    const nationwide: [number, number][] = [
      [98.98, 18.79], // Chiang Mai
      [102.83, 16.43], // Khon Kaen
      [100.5, 13.75], // Bangkok
      [99.33, 9.14], // Surat Thani
      [100.59, 7.2], // Songkhla
      [104.85, 15.24], // Ubon
    ]
    expect(trimOutlierCoords(nationwide)).toEqual(nationwide)
  })

  it('returns fewer than 3 points unchanged', () => {
    const two: [number, number][] = [[100.59, 7.2], [98.98, 18.79]]
    expect(trimOutlierCoords(two)).toEqual(two)
  })
})
