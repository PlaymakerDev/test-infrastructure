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
    map.addSource(SOURCE_ID, { type: 'vector', url: PLACE_TILESET })
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

  // Only hide the originals once replacements are up, so labels never blink out.
  if (added.length > 0) cfg.setConfigProperty?.('basemap', 'showPlaceLabels', false)

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
