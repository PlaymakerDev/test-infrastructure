"use client"
import type { Map as MapboxMap } from 'mapbox-gl'
import { mark } from '../utils/mapTrace'

/** The basemap's place-name layers, in the order Standard declares them. */
const PLACE_LABEL_IDS = [
  'country-label',
  'state-label',
  'continent-label',
  'settlement-major-label',
  'settlement-minor-label',
  'settlement-subdivision-label',
] as const

const SOURCE_ID = 'th-place-labels-src'
const LAYER_PREFIX = 'th-'
/** The tileset inside Standard's `composite` that carries `place_label`. */
const PLACE_TILESET = 'mapbox://mapbox.mapbox-streets-v8-lite'

type Json = unknown
type StdStyle = {
  layers?: Array<Record<string, Json> & { id: string }>
  schema?: Record<string, { default?: Json }>
}
type ConfigMap = MapboxMap & {
  setConfigProperty?: (importId: string, name: string, value: Json) => void
  getConfigProperty?: (importId: string, name: string) => Json
}
type LayerFilter = Parameters<MapboxMap['setFilter']>[1]
type SetLayout = (layerId: string, name: string, value: Json) => void

/** The layout properties `within` is moved into above the pitch gate — a
 *  symbol with neither text nor icon is never placed. */
const GATED_LAYOUT = ['text-field', 'icon-image'] as const

/** Below this many degrees under a gate's limit, switch back to the fast
 *  mode. Both modes are correct at every pitch they're used at, so the gap
 *  only costs speed — it stops a tilt hovering at the limit from swapping (and
 *  re-laying-out the label tiles) on every frame. */
const PITCH_GATE_HYSTERESIS = 2

const isPitchGate = (node: Json): node is [string, [string, Json, number], true, Json] =>
  Array.isArray(node) &&
  node.length === 4 &&
  node[0] === 'case' &&
  node[2] === true &&
  Array.isArray(node[1]) &&
  node[1][0] === '<=' &&
  Array.isArray(node[1][1]) &&
  node[1][1].length === 1 &&
  node[1][1][0] === 'pitch' &&
  typeof node[1][2] === 'number'

const usesCameraExpression = (node: Json): boolean => {
  const s = JSON.stringify(node)
  return s.includes('["pitch"]') || s.includes('["distance-from-center"]')
}

/**
 * Standard thins its labels out at high pitch with
 *   ["case", ["<=", ["pitch"], P], true, ["<=", ["distance-from-center"], D]]
 * which is `true` whenever pitch ≤ P. Returns the filter with every such gate
 * replaced by `true`, plus the lowest P — the pitch up to which the result is
 * exactly equivalent. Null when a camera expression appears in any other
 * shape, since nothing can then be proven about it.
 */
export function ungatePitch(filter: Json): { filter: Json; limit: number } | null {
  let limit = Infinity
  const walk = (node: Json): Json => {
    if (isPitchGate(node)) {
      limit = Math.min(limit, node[1][2])
      return true
    }
    return Array.isArray(node) ? node.map(walk) : node
  }
  const out = walk(filter)
  if (limit === Infinity || usesCameraExpression(out)) return null
  return { filter: out, limit }
}

const isZoomInput = (node: Json): boolean => Array.isArray(node) && node.length === 1 && node[0] === 'zoom'

/**
 * `expr` with every output replaced by `["case", cond, output, ""]`, so the
 * property resolves to nothing wherever `cond` is false. Mapbox rejects a
 * `["zoom"]` curve nested under `case`, so the condition is pushed through
 * `let` bodies and into each output of a zoom `step` instead of wrapping them.
 */
export function gateOn(expr: Json, cond: Json): Json {
  if (Array.isArray(expr) && expr[0] === 'let') {
    return [...expr.slice(0, -1), gateOn(expr[expr.length - 1], cond)]
  }
  if (Array.isArray(expr) && expr[0] === 'step' && isZoomInput(expr[1])) {
    // ["step", input, out0, stop1, out1, …] — outputs sit at the even indices.
    return expr.map((v, i) => (i >= 2 && i % 2 === 0 ? gateOn(v, cond) : v))
  }
  return ['case', cond, expr, '']
}

/**
 * Start the label tileset downloading, and switch the basemap's own place
 * names off, before anything has been drawn.
 *
 * Both halves matter for how the load LOOKS: the foreign names render as soon
 * as the basemap's first tiles arrive, so switching them off any later means
 * they flash on screen and then vanish; and our replacements can only draw
 * once this tileset is in, so starting it here rather than after the country
 * outline resolves is what stops the Thai names trailing in seconds behind.
 */
export function preloadThaiPlaceLabels(map: MapboxMap): void {
  const cfg = map as ConfigMap
  try {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'vector', url: PLACE_TILESET })
    }
    cfg.setConfigProperty?.('basemap', 'showPlaceLabels', false)
  } catch {
    // Style not ready or no such config — addThaiOnlyPlaceLabels retries.
  }
}

/**
 * Show the basemap's place names for Thailand only.
 *
 * The style imports Mapbox Standard, and imported layers live in another
 * scope: `getStyle().layers` never lists them and `setFilter` rejects them, so
 * they cannot be filtered in place. Config can only switch them off wholesale,
 * and a config value is evaluated once as a constant — a `within` or `zoom`
 * expression in one does nothing (both verified against the live style).
 *
 * So: switch Standard's place labels off, then re-add its own layer specs as
 * our layers, pointed at the same tileset with `within(Thailand)` AND-ed into
 * each filter. Copying the specs is what keeps Thai labels identical — same
 * fonts, sizes, zoom curves and collision rules as before.
 *
 * Costs one extra vector source (~the place tileset) since a root layer can't
 * reference a source that belongs to the import.
 *
 * The copied filters carry Standard's pitch gate (see `ungatePitch`). A filter
 * using `pitch`/`distance-from-center` becomes a mapbox "dynamic filter", and
 * the WHOLE filter — `within` included — is then re-evaluated for every label
 * on every placement pass, on the main thread. `within` re-projects all of
 * Thailand's ~15.6k outline vertices per call, so that alone was 650–1650ms of
 * main-thread time per zoom/pan in the z5–10 band (measured 2026-10-02, the
 * dashboard stutter). So `within` is kept out of the dynamic filter. Each
 * layer runs in one of two modes, both producing the same labels:
 *  - fast (pitch ≤ the gate's limit): the gate stripped from the filter —
 *    it's `true` there — and `within` left in it, now evaluated once per tile
 *    in the worker. The cheapest mode overall.
 *  - pitched (above it; the detail maps open at 55°): Standard's own filter,
 *    gate included, with `within` moved into text-field / icon-image instead
 *    (`gateOn`). Layout is also evaluated once per tile in the worker, at the
 *    cost of a second `within` call per label there.
 * If mapbox rejects the pitched layout, that layer falls back to `within` in
 * the full filter — the slow path, but never a missing or wrong label.
 *
 * Returns a cleanup that removes everything it added.
 */
export function addThaiOnlyPlaceLabels(
  map: MapboxMap,
  thailand: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
): () => void {
  const cfg = map as ConfigMap
  const std = (map.getStyle()?.imports?.[0] as { data?: StdStyle } | undefined)?.data
  if (!std?.layers) return () => {}

  // `["config", k]` only resolves inside the import, so bake the current value
  // into our copy.
  const resolve = (node: Json): Json => {
    if (Array.isArray(node)) {
      if (node[0] === 'config' && typeof node[1] === 'string') {
        const key = node[1]
        const live = cfg.getConfigProperty?.('basemap', key)
        return live ?? std.schema?.[key]?.default
      }
      return node.map(resolve)
    }
    if (node && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node as Record<string, Json>).map(([k, v]) => [k, resolve(v)]),
      )
    }
    return node
  }

  const within = ['within', thailand]
  const added: string[] = []
  type Mode = { filter: Json; layout: Record<string, Json> }
  const gated: Array<{ id: string; fast: Mode; pitched: Mode; limit: number; fastOn: boolean }> = []
  const initialPitch = map.getPitch()
  const setLayout = map.setLayoutProperty.bind(map) as unknown as SetLayout
  const apply = (id: string, mode: Mode) => {
    map.setFilter(id, mode.filter as LayerFilter)
    for (const [name, value] of Object.entries(mode.layout)) setLayout(id, name, value)
  }

  try {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'vector', url: PLACE_TILESET })
    }
  } catch {
    return () => {}
  }

  for (const id of PLACE_LABEL_IDS) {
    const spec = std.layers.find((l) => l.id === id)
    if (!spec) continue
    const copy = resolve(JSON.parse(JSON.stringify(spec))) as Record<string, Json> & { id: string }
    copy.id = `${LAYER_PREFIX}${id}`
    copy.source = SOURCE_ID
    // Standard gates these layers on its own switch:
    //   visibility: ["case", ["config","showPlaceLabels"], "visible", "none"]
    // which is already off by the time we copy, so the copy would inherit
    // "none" and hide itself. Ours are root layers with no such switch.
    const layout: Record<string, Json> = { ...(copy.layout as Record<string, Json> | undefined), visibility: 'visible' }
    copy.layout = layout
    // `slot` would place it back inside the import's stack, where the layer
    // no longer belongs.
    delete copy.slot
    const original = copy.filter
    const full: Json = original ? ['all', original, within] : within
    const ungated = original ? ungatePitch(original) : null
    const add = (filter: Json, layoutOverride: Record<string, Json> = {}): boolean => {
      try {
        map.addLayer({ ...copy, filter, layout: { ...layout, ...layoutOverride } } as Parameters<MapboxMap['addLayer']>[0])
      } catch {
        // Fall through — whether a layer exists is what decides.
      }
      // A spec mapbox rejects is reported as an error event, not thrown, and
      // leaves no layer behind.
      return !!map.getLayer(copy.id)
    }

    if (!ungated) {
      // No pitch gate → no dynamic filter, so `within` in the filter is
      // already evaluated once per tile in the worker.
      if (add(full)) added.push(copy.id)
      continue
    }

    const originalLayout: Record<string, Json> = {}
    const gatedLayout: Record<string, Json> = {}
    for (const name of GATED_LAYOUT) {
      if (layout[name] === undefined) continue
      originalLayout[name] = layout[name]
      gatedLayout[name] = gateOn(layout[name], within)
    }
    // The pitched spec goes in first: it's the one mapbox may reject.
    let pitched: Mode = { filter: original, layout: gatedLayout }
    if (!add(pitched.filter, pitched.layout)) {
      pitched = { filter: full, layout: originalLayout }
      if (!add(pitched.filter)) continue // Standard changed this layer's shape — skip it.
    }
    added.push(copy.id)
    const g = {
      id: copy.id,
      fast: { filter: ['all', ungated.filter, within], layout: originalLayout },
      pitched,
      limit: ungated.limit,
      fastOn: initialPitch <= ungated.limit,
    }
    // Before the first frame, so the tiles are only ever laid out once.
    if (g.fastOn) apply(g.id, g.fast)
    gated.push(g)
  }

  // The originals are already off (preloadThaiPlaceLabels). If not one copy
  // made it, give them back rather than leaving the map nameless.
  if (added.length === 0) cfg.setConfigProperty?.('basemap', 'showPlaceLabels', true)
  else {
    // The layers exist immediately; their tiles do not. That gap is what the
    // trace needs to show.
    const onData = () => {
      let loaded = false
      try { loaded = map.isSourceLoaded(SOURCE_ID) } catch { loaded = false }
      if (!loaded) return
      map.off('sourcedata', onData)
      mark('label tiles loaded')
    }
    map.on('sourcedata', onData)
  }

  // Swap each layer between its two modes as the camera tilts past the gate.
  // Fires per frame during a tilt; only a crossing touches the layer.
  const onPitch = () => {
    const pitch = map.getPitch()
    for (const g of gated) {
      const fastOn = g.fastOn ? pitch <= g.limit : pitch <= g.limit - PITCH_GATE_HYSTERESIS
      if (fastOn === g.fastOn) continue
      g.fastOn = fastOn
      try {
        if (map.getLayer(g.id)) apply(g.id, fastOn ? g.fast : g.pitched)
      } catch {
        // Layer gone mid-teardown.
      }
    }
  }
  if (gated.length > 0) map.on('pitch', onPitch)

  return () => {
    map.off('pitch', onPitch)
    try {
      for (const id of added) if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      cfg.setConfigProperty?.('basemap', 'showPlaceLabels', true)
    } catch {
      // Map already torn down.
    }
  }
}
