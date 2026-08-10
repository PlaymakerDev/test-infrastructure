"use client"
import React from 'react'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import LeftPanelTrafficLighting from './LeftPanelTrafficLighting'
import InfoCardTrafficLighting from './InfoCardTrafficLighting'
import MapTrafficLighting from './MapTrafficLighting'
import { useOverallContext } from '../../../context'

/** Top-area layout — 3 columns on desktop, same pattern as
 *  `LocationTrafficVolume`:
 *  • LEFT: device summary + diagram + ระบบไฟฟ้า / status cards
 *  • CENTER: Thailand map with lighting install-point markers
 *  • RIGHT: 4 info / stat cards
 *  Stacks vertically below `lg`, and both rails slide away in Map Focus Mode
 *  (the navbar toggle) because they're wrapped in `MapOverlayPanel`.
 *  Left column is 360px (not the 280px default, and a touch wider than
 *  traffic-signal's 320px) — it carries the single-line diagram plus the 5-chip
 *  ระบบไฟฟ้า row, which are the widest things in any rail on the app.
 *
 *  Height: `lg:min-h-[75dvh]` instead of the shared default's fixed
 *  `lg:h-[75dvh]`. Both rails here are taller than the other menus' (diagram +
 *  electrical + 2 status cards on the left, 4 stat cards on the right), so a
 *  fixed row height cut the last card off on each side and hid it behind a
 *  scrollbar. With an auto row the tallest rail sets the height, the map cell
 *  (`lg:h-full`) grows down to match it, and every card is fully visible —
 *  75dvh stays the floor so a short/filtered dataset still gets a big map.
 *
 *  Each rail therefore PINS its own width (`lg:w-90` = 360px, `lg:w-70` =
 *  280px — same values as `desktopCols`). Map Focus Mode collapses both
 *  columns to `0px`, and a 0px-wide rail whose width came from the column
 *  would re-wrap its content into a tall vertical strip — which, now that the
 *  row height follows the content, stretched the map to several screens tall
 *  when "ซ่อนทั้งสองฝั่ง" was pressed. Pinned widths keep each rail's height
 *  identical whether its column is 320px or 0px, so focus mode only ever
 *  changes the map's WIDTH. `lg:overflow-hidden` on the grid then clips the
 *  slid-away rails so they can't add a horizontal scroll region. */
const LocationTrafficLighting: React.FC = () => {
  const { deptId, roadId } = useOverallContext()

  return (
    <MapFocusGrid
      className='grid grid-cols-1 gap-4 lg:min-h-[75dvh] lg:overflow-hidden'
      desktopCols='360px minmax(0, 1fr) 280px'
    >
      {/* LEFT — device summary / diagram / electrical cards */}
      <MapOverlayPanel
        position='left'
        className='row-start-2 lg:row-start-1 lg:col-start-1 lg:w-90 lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <LeftPanelTrafficLighting />
      </MapOverlayPanel>

      {/* CENTER — Map */}
      <div className='row-start-1 lg:col-start-2 relative rounded-lg overflow-hidden h-[50dvh] lg:h-full'>
        <MapTrafficLighting deptId={deptId} roadId={roadId} />
      </div>

      {/* RIGHT — Info cards */}
      <MapOverlayPanel
        position='right'
        className='row-start-3 lg:row-start-1 lg:col-start-3 lg:w-70 lg:overflow-x-hidden lg:h-full flex flex-col gap-4'
      >
        <InfoCardTrafficLighting />
      </MapOverlayPanel>
    </MapFocusGrid>
  )
}

export default React.memo(LocationTrafficLighting)
