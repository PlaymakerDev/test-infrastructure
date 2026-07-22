"use client"
import React from 'react'
import { CCTVSection, MapSection } from '../../../components'
import MapFocusGrid from '@/components/section/MapFocusGrid'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'

interface Props { }

/** ภาพรวม tab layout — camera rail + map. Uses the shared MapFocusGrid /
 *  MapOverlayPanel pair so the navbar's เน้นแผนที่ toggle works here
 *  (registers as a focus consumer + slides the rail away), same as every
 *  other overall page (2026-07-22). */
const LocationSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <MapFocusGrid
      className='grid grid-cols-1 gap-4 lg:h-[85dvh]'
      desktopCols='340px minmax(0, 1fr)'
      focusedCols='0px minmax(0, 1fr)'
    >
      {/* min-h-0 + overflow-hidden — without them the grid item's automatic
        * minimum size lets the 0px focused column wrap its text into a huge
        * height, inflating the row (and the map) past 85dvh. */}
      <MapOverlayPanel position='left' className='lg:col-start-1 lg:row-start-1 lg:h-full min-h-0 lg:overflow-hidden'>
        <CCTVSection />
      </MapOverlayPanel>
      <MapSection />
    </MapFocusGrid>
  )
}

export default React.memo(LocationSection)
