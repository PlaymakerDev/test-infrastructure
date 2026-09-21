import { describe, expect, it } from 'vitest'
import { boundsContain, inBounds, padBounds, type Bounds } from './useViewportBounds'

// The culling guarantee this file exists to protect: while the hook keeps
// serving a padded box (it only recomputes once the viewport leaves it), every
// point the user can actually SEE must still test as inside. If that ever
// breaks, road bubbles vanish from the screen mid-pan.

const view: Bounds = [100, 13, 101, 14]

describe('padBounds', () => {
  it('grows by pad × the box size on each side', () => {
    expect(padBounds(view, 1)).toEqual([99, 12, 102, 15])
    expect(padBounds(view, 0.5)).toEqual([99.5, 12.5, 101.5, 14.5])
    expect(padBounds(view, 0)).toEqual(view)
  })
})

describe('boundsContain', () => {
  it('accepts a box inside, and one that exactly matches', () => {
    expect(boundsContain(padBounds(view, 1), view)).toBe(true)
    expect(boundsContain(view, view)).toBe(true)
  })

  it('rejects a box that pokes out on any single side', () => {
    const outer = padBounds(view, 1)
    for (const i of [0, 1, 2, 3]) {
      const inner: Bounds = [...outer]
      inner[i] += i < 2 ? -1e-9 : 1e-9
      expect(boundsContain(outer, inner)).toBe(false)
    }
  })
})

describe('inBounds', () => {
  it('includes the edges and excludes just past them', () => {
    expect(inBounds(view, 100, 13)).toBe(true)
    expect(inBounds(view, 101, 14)).toBe(true)
    expect(inBounds(view, 100.5, 13.5)).toBe(true)
    expect(inBounds(view, 100 - 1e-9, 13.5)).toBe(false)
    expect(inBounds(view, 100.5, 14 + 1e-9)).toBe(false)
  })
})

describe('culling never drops an on-screen point', () => {
  it('holds for every pan the hook serves without recomputing', () => {
    const published = padBounds(view, 1)
    const w = view[2] - view[0]
    const h = view[3] - view[1]

    // Walk the camera in small steps across the whole reuse window and past
    // it; assert the property for as long as the hook would keep this box.
    let checkedInside = 0
    for (let dx = -1.5; dx <= 1.5; dx += 0.1) {
      for (let dy = -1.5; dy <= 1.5; dy += 0.1) {
        const moved: Bounds = [
          view[0] + dx * w, view[1] + dy * h,
          view[2] + dx * w, view[3] + dy * h,
        ]
        if (!boundsContain(published, moved)) continue // hook recomputes here
        checkedInside++
        // Sample the moved viewport, corners included.
        for (let fx = 0; fx <= 1; fx += 0.25) {
          for (let fy = 0; fy <= 1; fy += 0.25) {
            const lng = moved[0] + fx * (moved[2] - moved[0])
            const lat = moved[1] + fy * (moved[3] - moved[1])
            expect(inBounds(published, lng, lat)).toBe(true)
          }
        }
      }
    }
    // A degenerate run that never entered the loop would pass vacuously.
    expect(checkedInside).toBeGreaterThan(50)
  })

  it('a zoom-out that outgrows the box forces a recompute', () => {
    const published = padBounds(view, 1)
    const zoomedOut: Bounds = [98, 11, 103, 16]
    expect(boundsContain(published, zoomedOut)).toBe(false)
  })
})
