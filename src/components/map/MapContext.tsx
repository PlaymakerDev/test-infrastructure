"use client"
import { createContext } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

export interface MapContextValue {
  /** The mapbox-gl Map instance — null until BaseMap finishes initialization */
  map: MapboxMap | null
  /** True after `map.on('load')` fires — children should gate their effects on this */
  isLoaded: boolean
}

export const MapContext = createContext<MapContextValue>({
  map: null,
  isLoaded: false,
})
