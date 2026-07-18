"use client"
import { useEffect, useRef } from 'react'
import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  MapMouseEvent,
  PopupOptions,
  SymbolLayerSpecification,
} from 'mapbox-gl'

/** Color may be a static string (most cases) or a Mapbox data-driven
 *  expression (e.g. `['case', ['get', 'is_online'], '#22d3ee', '#ef4444']`)
 *  when colour needs to be derived from a feature's properties. */
export type MarkerColor = string | ExpressionSpecification
import { useMap } from '../hooks/useMap'
import { showReactPopup } from './popupHelper'

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>

/** Deterministic Mapbox source id for a given MarkerLayer `id` prop — lets a
 *  caller's `onClusterClick` call `map.getSource(...)` for its own
 *  `getClusterExpansionZoom`/`getClusterLeaves` calls without hardcoding
 *  this component's internal naming convention. */
export const markerLayerSourceId = (id: string) => `markerlayer-src-${id}`

/**
 * Generic marker layer — wraps a GeoJSON source plus 1-3 mapbox layers.
 *
 * Behavior matrix:
 *   - cluster=false, iconImage=undefined  → 1 circle layer
 *   - cluster=false, iconImage="..."      → 1 circle + 1 symbol (icon)
 *   - cluster=true,  iconImage=undefined  → 2 circles (cluster + unclustered) + 1 symbol (count text)
 *   - cluster=true,  iconImage="..."      → 2 circles + 1 symbol (icon + count for clusters)
 */
export interface MarkerLayerProps {
  /** Stable unique id — used as suffix for source/layer names */
  id: string
  /** GeoJSON FeatureCollection — point features */
  data: FeatureCollection
  /** Enable Mapbox built-in clustering */
  cluster?: boolean
  clusterMaxZoom?: number
  clusterRadius?: number

  /** Circle marker color (also used for cluster bubble). Accepts a plain hex
   *  string OR a Mapbox expression for data-driven colouring. */
  color: MarkerColor
  /** Circle radius for unclustered points (default 16) */
  size?: number
  /** Stroke around circle (default white 2px for unclustered, 2.5px for cluster) */
  strokeColor?: string
  /** Stroke width for unclustered points (default 2) */
  strokeWidth?: number
  /** Stroke width for cluster bubbles (default 2.5) */
  clusterStrokeWidth?: number
  /** Optional registered icon image name. Must be added to map BEFORE this component renders */
  iconImage?: string
  /** Icon scale relative to the source 64px image (default 0.36 unclustered, ramps for cluster) */
  iconSize?: number

  /** GeoJSON property (string or number) to show as text on UNCLUSTERED points
   *  too, not just the cluster count badge. Omit to keep unclustered points
   *  textless (default — matches every existing consumer). */
  unclusteredCountProperty?: string
  /** Numeric GeoJSON property to SUM across merged points and show as the
   *  cluster bubble's text, instead of Mapbox's default `point_count`
   *  (literally "how many points got merged here" — meaningless/inconsistent
   *  when the same property is also shown per-item via
   *  `unclusteredCountProperty`, e.g. "3 install points" on one marker vs
   *  "4 markers merged" on a cluster). Omit to keep the default behavior. */
  clusterSumProperty?: string
  /** Numeric GeoJSON property (typically a 0/1 flag) to SUM across merged
   *  points into a cluster property named "colorSum" — lets `color`'s
   *  expression branch a cluster bubble by an aggregated condition (e.g.
   *  "any offline device in this cluster") instead of always falling back
   *  to a flat default, since Mapbox clusters don't otherwise inherit
   *  arbitrary per-feature properties like `color`. Omit to skip. */
  clusterColorSumProperty?: string
  /** Caps the cluster bubble's SUMMED text (via `clusterSumProperty`) at this
   *  value — a cluster whose sum exceeds it shows `${countCapThreshold}+`
   *  instead of the raw sum. Has no effect without `clusterSumProperty`, and
   *  no effect on unclustered points (cap that yourself in the GeoJSON
   *  property passed to `unclusteredCountProperty`). */
  countCapThreshold?: number
  /** Text anchor for the count/label (default 'top', matching the
   *  icon+badge-below-it layout). Pass 'center' for a plain circle+number
   *  marker with no icon. */
  textAnchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  textOffset?: [number, number]
  textSize?: number
  textColor?: string

  /** minzoom on all layers */
  minZoom?: number
  /** Toggle visibility (default true) */
  visible?: boolean

  /** Click on a single (unclustered) feature */
  onClick?: (e: MapMouseEvent, feature: GeoJSON.Feature) => void
  /** Click on a cluster bubble — default expands to next zoom */
  onClusterClick?: (e: MapMouseEvent, clusterFeature: GeoJSON.Feature) => void
  /**
   * Render JSX inside a Mapbox popup when an unclustered feature is clicked.
   * Only one popup is open per map at a time — opening a new one closes the previous.
   * If `onClick` is also provided, both run.
   */
  popup?: (feature: GeoJSON.Feature) => React.ReactNode
  /** Mapbox popup options (offset, closeButton, className, ...) */
  popupOptions?: PopupOptions
}

const MarkerLayer: React.FC<MarkerLayerProps> = ({
  id,
  data,
  cluster = false,
  clusterMaxZoom = 14,
  clusterRadius = 60,
  color,
  size = 18,
  strokeColor = '#ffffff',
  strokeWidth = 2,
  clusterStrokeWidth = 2.5,
  iconImage,
  iconSize,
  unclusteredCountProperty,
  clusterSumProperty,
  clusterColorSumProperty,
  countCapThreshold,
  textAnchor = 'top',
  textOffset = [0, 0.5],
  textSize = 12,
  textColor = '#ffffff',
  minZoom,
  visible = true,
  onClick,
  onClusterClick,
  popup,
  popupOptions,
}) => {
  const { map, isLoaded } = useMap()
  const sourceId = markerLayerSourceId(id)
  const clusterLayerId = `markerlayer-cluster-${id}`
  const pointLayerId = `markerlayer-point-${id}`
  const symbolLayerId = `markerlayer-symbol-${id}`

  // Stable refs for handlers so we can detach cleanly + always read latest props
  const onClickRef = useRef(onClick)
  const onClusterClickRef = useRef(onClusterClick)
  const popupRef = useRef(popup)
  const popupOptionsRef = useRef(popupOptions)
  useEffect(() => { onClickRef.current = onClick }, [onClick])
  useEffect(() => { onClusterClickRef.current = onClusterClick }, [onClusterClick])
  useEffect(() => { popupRef.current = popup }, [popup])
  useEffect(() => { popupOptionsRef.current = popupOptions }, [popupOptions])

  // Add source + layers once map is loaded
  useEffect(() => {
    if (!map || !isLoaded) return

    const sourceSpec: GeoJSONSourceSpecification = {
      type: 'geojson',
      data,
      ...(cluster && {
        cluster: true, clusterMaxZoom, clusterRadius,
        ...((clusterSumProperty || clusterColorSumProperty) && {
          clusterProperties: {
            ...(clusterSumProperty && { sum: ['+', ['get', clusterSumProperty]] }),
            ...(clusterColorSumProperty && { colorSum: ['+', ['get', clusterColorSumProperty]] }),
          },
        }),
      }),
    }
    map.addSource(sourceId, sourceSpec)

    if (cluster) {
      // Cluster bubble (circle, scales with point_count)
      const clusterSpec: CircleLayerSpecification = {
        id: clusterLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        ...(minZoom !== undefined && { minzoom: minZoom }),
        paint: {
          'circle-color': color,
          'circle-radius': ['step', ['get', 'point_count'], 22, 10, 26, 50, 30, 100, 36],
          'circle-stroke-width': clusterStrokeWidth,
          'circle-stroke-color': strokeColor,
          'circle-opacity': 0.95,
        },
      }
      map.addLayer(clusterSpec)

      // Unclustered point (circle)
      const pointSpec: CircleLayerSpecification = {
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        ...(minZoom !== undefined && { minzoom: minZoom }),
        paint: {
          'circle-color': color,
          'circle-radius': size,
          'circle-stroke-width': strokeWidth,
          'circle-stroke-color': strokeColor,
        },
      }
      map.addLayer(pointSpec)

      // Symbol overlay: icon for everything + count text on clusters
      const symbolSpec: SymbolLayerSpecification = {
        id: symbolLayerId,
        type: 'symbol',
        source: sourceId,
        ...(minZoom !== undefined && { minzoom: minZoom }),
        layout: {
          ...(iconImage && {
            'icon-image': iconImage,
            // Cluster glyph scales WITH the cluster circle (same breakpoints as
            // circle-radius: 10/50/100) so the icon fills the badge ~consistently
            // (~75%) instead of shrinking away inside the bigger cluster circles.
            // Unclustered stays at the single-marker size (0.50).
            'icon-size': [
              'case',
              ['has', 'point_count'],
              ['step', ['get', 'point_count'], iconSize ?? 0.54, 10, 0.62, 50, 0.72, 100, 0.84],
              iconSize ?? 0.50,
            ],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': 'center',
            'icon-offset': [
              'case',
              ['has', 'point_count'],
              ['literal', [0, -8]],
              ['literal', [0, 0]],
            ],
          }),
          'text-field': [
            'case',
            ['has', 'point_count'],
            clusterSumProperty
              ? (countCapThreshold !== undefined
                ? ['case', ['>', ['get', 'sum'], countCapThreshold], `${countCapThreshold}+`, ['to-string', ['get', 'sum']]] as ExpressionSpecification
                : ['to-string', ['get', 'sum']] as ExpressionSpecification)
              : ['get', 'point_count_abbreviated'],
            unclusteredCountProperty ? ['to-string', ['get', unclusteredCountProperty]] : '',
          ],
          'text-font': ['Arial Unicode MS Bold'],
          'text-size': textSize,
          'text-anchor': textAnchor,
          'text-offset': textOffset,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: { 'text-color': textColor },
      }
      map.addLayer(symbolSpec)
    } else {
      // Non-clustered: just one circle (and optional symbol icon)
      const pointSpec: CircleLayerSpecification = {
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        ...(minZoom !== undefined && { minzoom: minZoom }),
        paint: {
          'circle-color': color,
          'circle-radius': size,
          'circle-stroke-width': strokeWidth,
          'circle-stroke-color': strokeColor,
        },
      }
      map.addLayer(pointSpec)

      if (iconImage) {
        const symbolSpec: SymbolLayerSpecification = {
          id: symbolLayerId,
          type: 'symbol',
          source: sourceId,
          ...(minZoom !== undefined && { minzoom: minZoom }),
          layout: {
            'icon-image': iconImage,
            'icon-size': iconSize ?? 0.50,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': 'center',
          },
        }
        map.addLayer(symbolSpec)
      }
    }

    // Click handlers
    const handleClusterClick = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] })
      const f = features[0]
      if (!f) return
      if (onClusterClickRef.current) {
        onClusterClickRef.current(e, f)
        return
      }
      // Default: expand to next zoom
      const clusterId = f.properties?.cluster_id
      if (typeof clusterId !== 'number') return
      const src = map.getSource(sourceId) as GeoJSONSource
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null || f.geometry.type !== 'Point') return
        map.flyTo({
          center: f.geometry.coordinates as [number, number],
          zoom: zoom + 0.3,
          duration: 800,
        })
      })
    }

    const handlePointClick = (e: MapMouseEvent) => {
      const f = (e as MapMouseEvent & { features?: GeoJSON.Feature[] }).features?.[0]
      if (!f) return
      onClickRef.current?.(e, f)
      // Show popup if a render function was provided
      if (popupRef.current && f.geometry.type === 'Point') {
        const coords = (f.geometry.coordinates as [number, number]).slice() as [number, number]
        import('mapbox-gl').then(({ default: mb }) => {
          showReactPopup({
            map,
            mb,
            lngLat: coords,
            content: popupRef.current!(f),
            options: popupOptionsRef.current,
          })
        })
      }
    }

    const setCursor = (v: string) => () => { map.getCanvas().style.cursor = v }
    const enter = setCursor('pointer')
    const leave = setCursor('')

    if (cluster) {
      map.on('click', clusterLayerId, handleClusterClick)
      map.on('mouseenter', clusterLayerId, enter)
      map.on('mouseleave', clusterLayerId, leave)
    }
    map.on('click', pointLayerId, handlePointClick)
    map.on('mouseenter', pointLayerId, enter)
    map.on('mouseleave', pointLayerId, leave)

    return () => {
      try {
        if (cluster) {
          map.off('click', clusterLayerId, handleClusterClick)
          map.off('mouseenter', clusterLayerId, enter)
          map.off('mouseleave', clusterLayerId, leave)
        }
        map.off('click', pointLayerId, handlePointClick)
        map.off('mouseenter', pointLayerId, enter)
        map.off('mouseleave', pointLayerId, leave)
        if (map.getLayer(symbolLayerId)) map.removeLayer(symbolLayerId)
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId)
        if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // Map already torn down — ignore
      }
    }
    // `data` is intentionally not a dep — handled by the separate setData effect below
    //  to avoid rebuilding all layers on every data change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map, isLoaded, id, sourceId, clusterLayerId, pointLayerId, symbolLayerId,
    cluster, clusterMaxZoom, clusterRadius, color, size, strokeColor, strokeWidth, clusterStrokeWidth,
    iconImage, iconSize, unclusteredCountProperty, clusterSumProperty, clusterColorSumProperty, countCapThreshold, textAnchor, textOffset, textSize, textColor, minZoom,
  ])

  // Update data without rebuilding layers
  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(sourceId) as GeoJSONSource | undefined
    if (src) src.setData(data)
  }, [map, isLoaded, sourceId, data])

  // Visibility toggle
  useEffect(() => {
    if (!map || !isLoaded) return
    const vis = visible ? 'visible' : 'none'
    for (const layerId of [clusterLayerId, pointLayerId, symbolLayerId]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis)
    }
  }, [map, isLoaded, visible, clusterLayerId, pointLayerId, symbolLayerId])

  return null
}

export default MarkerLayer
