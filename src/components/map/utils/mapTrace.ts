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
// Whatever a previous call bound. React runs effects twice in dev and the
// first map instance is thrown away, so a plain "already watching" flag left
// the listeners on the dead map and the live one reported nothing.
let detachFrames: (() => void) | null = null
let detachLongFrames: (() => void) | null = null

// DOM markers created/destroyed and viewport recomputes during one camera
// move. Mount churn is invisible in a frame-time average but is exactly what
// a fly-to across every zoom tier produces.
let mounts = 0
let unmounts = 0
let viewportRecalcs = 0
// How many DOM markers are attached right now. Mapbox re-projects and
// rewrites the transform of every one of them on every move frame, so this
// is the number that decides whether a pan can hold 60fps at all.
let liveMarkers = 0

export function countMarkerMount(delta: 1 | -1): void {
  if (!traceOn()) return
  if (delta === 1) mounts++
  else unmounts++
  liveMarkers += delta
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
  if (!traceOn()) return () => {}
  detachFrames?.()
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
      `| markers +${mounts}/-${unmounts} live ${liveMarkers}  viewport recalc ${viewportRecalcs}`,
      'color:#FCD116',
    )
  }
  map.on('render', onRender)
  map.on('movestart', onMoveStart)
  map.on('moveend', onMoveEnd)
  const off = () => {
    map.off('render', onRender)
    map.off('movestart', onMoveStart)
    map.off('moveend', onMoveEnd)
    if (detachFrames === off) detachFrames = null
  }
  detachFrames = off
  return off
}

/**
 * Report every long frame, whatever caused it.
 *
 * `watchFrames` only reports when the camera stops, and only counts frames
 * mapbox itself painted — so a stutter while the map is standing still (a
 * poll landing, a React commit, a tier expanding) leaves no trace in it.
 * This is a plain rAF loop, so it sees every frame the browser misses and
 * says what the map was doing at the time.
 */
/** Two frame budgets. Below this nothing is perceptible; above it the eye
 *  reads a skip, which is what "กระตุกเล็กๆ" means — well under the 50ms a
 *  single-frame log would report. */
const JANK_MS = 33

export function watchLongFrames(map: MapLike, loudMs = 50, windowMs = 10000): () => void {
  if (!traceOn()) return () => {}
  detachLongFrames?.()
  let raf = 0
  let prev = performance.now()
  let windowStart = prev
  let lastMarkers = liveMarkers
  let win: number[] = []

  const report = () => {
    if (win.length < 5) return
    const sorted = [...win].sort((a, b) => a - b)
    const jank = win.filter((f) => f > JANK_MS).length
    console.log(
      `%c[map] ${(windowMs / 1000).toFixed(0)}s  frames ${win.length}  ` +
      `median ${sorted[Math.floor(sorted.length / 2)].toFixed(1)}ms  ` +
      `worst ${sorted[sorted.length - 1].toFixed(0)}ms  ` +
      `>${JANK_MS}ms: ${jank} (${((jank / win.length) * 100).toFixed(0)}%)  ` +
      `| @z${map.getZoom().toFixed(1)}  DOM markers ${liveMarkers}`,
      jank > 0 ? 'color:#FCD116' : 'color:#7ED321',
    )
  }

  const tick = () => {
    const now = performance.now()
    const dt = now - prev
    prev = now
    win.push(dt)
    if (dt > loudMs) {
      const churn = liveMarkers - lastMarkers
      console.log(
        `%c[map] long frame ${dt.toFixed(0)}ms  @z${map.getZoom().toFixed(1)}  ` +
        `DOM markers ${liveMarkers}${churn !== 0 ? ` (${churn > 0 ? '+' : ''}${churn})` : ''}`,
        'color:#FF6666',
      )
    }
    if (now - windowStart >= windowMs) {
      report()
      win = []
      windowStart = now
    }
    lastMarkers = liveMarkers
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  const off = () => {
    cancelAnimationFrame(raf)
    if (detachLongFrames === off) detachLongFrames = null
  }
  detachLongFrames = off
  return off
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
