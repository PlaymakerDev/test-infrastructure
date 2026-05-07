"use client"
import { useEffect, useRef } from 'react'
import type {
  CircleLayerSpecification,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  MapMouseEvent,
  PopupOptions,
  SymbolLayerSpecification,
} from 'mapbox-gl'
import { useMap } from '../hooks/useMap'
import { showReactPopup } from './popupHelper'

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>

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

  /** Circle marker color (also used for cluster bubble) */
  color: string
  /** Circle radius for unclustered points (default 16) */
  size?: number
  /** Stroke around circle (default white 2px for unclustered, 2.5px for cluster) */
  strokeColor?: string
  /** Optional registered icon image name. Must be added to map BEFORE this component renders */
  iconImage?: string
  /** Icon scale relative to the source 64px image (default 0.36 unclustered, ramps for cluster) */
  iconSize?: number

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
  size = 16,
  strokeColor = '#ffffff',
  iconImage,
  iconSize,
  minZoom,
  visible = true,
  onClick,
  onClusterClick,
  popup,
  popupOptions,
}) => {
  const { map, isLoaded } = useMap()
  const sourceId = `markerlayer-src-${id}`
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
      ...(cluster && { cluster: true, clusterMaxZoom, clusterRadius }),
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
          'circle-stroke-width': 2.5,
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
          'circle-stroke-width': 2,
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
            'icon-size': [
              'case',
              ['has', 'point_count'],
              ['step', ['get', 'point_count'], iconSize ?? 0.32, 50, 0.36, 100, 0.4],
              iconSize ?? 0.36,
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
            ['get', 'point_count_abbreviated'],
            '',
          ],
          'text-font': ['Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 0.5],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: { 'text-color': '#ffffff' },
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
          'circle-stroke-width': 2,
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
            'icon-size': iconSize ?? 0.36,
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
    cluster, clusterMaxZoom, clusterRadius, color, size, strokeColor,
    iconImage, iconSize, minZoom,
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
