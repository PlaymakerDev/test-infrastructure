"use client"
import type { Map as MapboxMap } from 'mapbox-gl'

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
    copy.filter = copy.filter ? ['all', copy.filter, within] : within
    // Standard gates these layers on its own switch:
    //   visibility: ["case", ["config","showPlaceLabels"], "visible", "none"]
    // which is already off by the time we copy, so the copy would inherit
    // "none" and hide itself. Ours are root layers with no such switch.
    copy.layout = { ...(copy.layout as Record<string, Json> | undefined), visibility: 'visible' }
    // `slot` would place it back inside the import's stack, where the layer
    // no longer belongs.
    delete copy.slot
    try {
      map.addLayer(copy as Parameters<MapboxMap['addLayer']>[0])
      added.push(copy.id)
    } catch {
      // Standard changed this layer's shape — skip it rather than fail the map.
    }
  }

  // The originals are already off (preloadThaiPlaceLabels). If not one copy
  // made it, give them back rather than leaving the map nameless.
  if (added.length === 0) cfg.setConfigProperty?.('basemap', 'showPlaceLabels', true)

  return () => {
    try {
      for (const id of added) if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      cfg.setConfigProperty?.('basemap', 'showPlaceLabels', true)
    } catch {
      // Map already torn down.
    }
  }
}
