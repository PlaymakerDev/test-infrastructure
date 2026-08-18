"use client"
import { createElement, useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { IconType } from 'react-icons'
import {
  TbVideo,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCar,
  TbCarCrash,
  TbWalk,
  TbTrafficLights,
} from 'react-icons/tb'
import { FaRegLightbulb } from 'react-icons/fa6'
import IconTracking from '@/components/icon/IconTracking'
import IconLPR from '@/components/icon/IconLPR'
import type { SystemType } from '@/features/admin/dashboard/data/systems'
import { useMap } from './useMap'

/** Per-device-type icon — same glyphs as the top-menu trapezoid (Navbar.tsx),
 *  so on-map markers match the menu 1:1. Exported so HTML aggregate bubbles
 *  (RegionSummaryLayer) can render the exact same glyph as the pin layer. */
export const SYSTEM_ICONS: Record<SystemType, IconType> = {
  CCTV: TbVideo,
  VMS: TbDeviceDesktop,
  WIM: IconTracking,
  LPR: IconLPR,
  Lighting: FaRegLightbulb,
  BridgeLighting: TbBuildingBridge,
  Tunnel: TbBuildingBridge2,
  Counting: TbCar,
  CrossWalk: TbWalk,
  Analytic: TbCarCrash,
  Traffic: TbTrafficLights,
}

/** Render a react-icon to a white SVG image usable by a Mapbox symbol layer. */
function iconToImage(IconComp: IconType, size = 64): Promise<HTMLImageElement> {
  const svg = renderToStaticMarkup(
    createElement(IconComp, { size, color: '#ffffff', strokeWidth: 2.4 }),
  )
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  return new Promise((resolve, reject) => {
    const img = new Image(size, size)
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

/**
 * Registers the given device type's icon on the current map (once) and returns
 * the registered image name — or `undefined` until it's ready. Feed the result
 * to `MarkerLayer`'s `iconImage` so the symbol layer draws the menu glyph.
 * Must be called inside a `BaseMap` (MapContext).
 */
export function useDeviceIcon(type: SystemType): string | undefined {
  const { map, isLoaded } = useMap()
  const [ready, setReady] = useState(false)
  const name = `device-icon-${type}`

  useEffect(() => {
    if (!map || !isLoaded) return
    if (map.hasImage(name)) {
      setReady(true)
      return
    }
    let cancelled = false
    iconToImage(SYSTEM_ICONS[type], 64)
      .then((img) => {
        if (cancelled) return
        if (!map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 })
        setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [map, isLoaded, name, type])

  return ready ? name : undefined
}
