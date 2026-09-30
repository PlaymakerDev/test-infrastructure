"use client"

/**
 * Timing trace for the map pipeline — off unless asked for.
 *
 * Turn on with `?maptrace=1` in the URL (or `localStorage.maptrace = '1'`).
 * It records a mark per step, watches frame times while the camera moves, and
 * prints the step table when the map first goes idle.
 */

type Mark = { label: string; t: number; detail?: Record<string, unknown> }

let enabled: boolean | null = null
const marks: Mark[] = []
let dumped = false

export function traceOn(): boolean {
  if (enabled !== null) return enabled
  if (typeof window === 'undefined') return (enabled = false)
  try {
    enabled =
      new URLSearchParams(window.location.search).get('maptrace') === '1' ||
      window.localStorage.getItem('maptrace') === '1'
  } catch {
    enabled = false
  }
  return enabled
}

/** Record a step. `detail` becomes extra columns (counts, sizes, …). */
export function mark(label: string, detail?: Record<string, unknown>): void {
  if (!traceOn()) return
  marks.push({ label, t: performance.now(), detail })
}

// Long frames are what "laggy" actually means: mapbox fires `render` once per
// painted frame, so the gap between two of them is that frame's cost.
let frames: number[] = []
let lastFrame = 0
let watching = false

// DOM markers created/destroyed and viewport recomputes during one camera
// move. Mount churn is invisible in a frame-time average but is exactly what
// a fly-to across every zoom tier produces.
let mounts = 0
let unmounts = 0
let viewportRecalcs = 0

export function countMarkerMount(delta: 1 | -1): void {
  if (!traceOn()) return
  if (delta === 1) mounts++
  else unmounts++
}

export function countViewportRecalc(): void {
  if (!traceOn()) return
  viewportRecalcs++
}

type MapLike = {
  on: (ev: string, cb: () => void) => void
  off: (ev: string, cb: () => void) => void
  getZoom: () => number
}

export function watchFrames(map: MapLike): () => void {
  if (!traceOn() || watching) return () => {}
  watching = true
  const onRender = () => {
    const now = performance.now()
    if (lastFrame) frames.push(now - lastFrame)
    lastFrame = now
  }
  const onMoveStart = () => { frames = []; lastFrame = 0; mounts = 0; unmounts = 0; viewportRecalcs = 0 }
  const onMoveEnd = () => {
    if (frames.length < 5) return
    const sorted = [...frames].sort((a, b) => a - b)
    const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]
    const long = frames.filter((f) => f > 50).length
    console.log(
      `%c[map] move @z${map.getZoom().toFixed(1)}  frames ${frames.length}  ` +
      `median ${p(0.5).toFixed(1)}ms  p95 ${p(0.95).toFixed(1)}ms  worst ${sorted[sorted.length - 1].toFixed(1)}ms  ` +
      `>50ms: ${long} (${((long / frames.length) * 100).toFixed(0)}%)  ~${(1000 / p(0.5)).toFixed(0)} fps  ` +
      `| markers +${mounts}/-${unmounts}  viewport recalc ${viewportRecalcs}`,
      'color:#FCD116',
    )
  }
  map.on('render', onRender)
  map.on('movestart', onMoveStart)
  map.on('moveend', onMoveEnd)
  return () => {
    watching = false
    map.off('render', onRender)
    map.off('movestart', onMoveStart)
    map.off('moveend', onMoveEnd)
  }
}

/** Print the table even if the map never goes idle (a stuck tile, a source
 *  that never finishes) — otherwise a slow load, the case worth looking at,
 *  is the one that reports nothing. */
export function dumpTraceSoon(ms = 15000): void {
  if (!traceOn()) return
  setTimeout(dumpTrace, ms)
}

/** Print the step table. Only the first call prints. */
export function dumpTrace(): void {
  if (!traceOn() || dumped || marks.length === 0) return
  dumped = true
  const t0 = marks[0].t
  let prev = t0
  const rows = marks.map((m) => {
    const row = {
      step: m.label,
      'since start (ms)': Math.round(m.t - t0),
      'took (ms)': Math.round(m.t - prev),
      ...(m.detail ?? {}),
    }
    prev = m.t
    return row
  })
  console.log('%c[map] ลำดับการโหลดแผนที่', 'color:#FCD116;font-weight:bold')
  console.table(rows)
}
