"use client"
import React, { useEffect, useRef, useState } from 'react'
import MapEventSection from './MapEventSection'
import RemoteControlCard from './RemoteControlCard'
import StatusCardsColumn from './StatusCardsColumn'
import ConnectionCircuitCards from './ConnectionCircuitCards'
import VoltageAmpChartsRow from './VoltageAmpChartsRow'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import { MapEdgeFade } from '@/components/map/BaseMap'
import { useDetailContext } from '../context'

// Diagram wrapper's own fixed height (see the comment on that div below) —
// one of the three candidates the container's min-height maximizes over.
const DIAGRAM_HEIGHT = 400
const DIAGRAM_PADDING = 24 // px, matches the `p-6` on the diagram card below

/** OVERVIEW tab layout — full-size diagram iframe with the remote control
 *  card (top-left) and status column (top-right) floating on top of it, like
 *  the overall page's map + corner stat cards. Below: charts + map/event
 *  section. */
const OverviewSection: React.FC = () => {
  const { imei, project, deviceLoaded } = useDetailContext()

  // RemoteControlCard (left) and StatusCardsColumn (right) are absolutely
  // positioned over the diagram, like the overall page's floating stat
  // cards — so this container's height has to be driven by the tallest of
  // the three by hand. ElectricalSystemCard's "แสดงข้อมูลทุกเฟส" expansion
  // makes the right column grow/shrink, so the reserved height must track
  // exactly how tall each side currently is — no fixed baseline — or it
  // either overlaps VoltageAmpChartsRow below (too short) or leaves a dead
  // gap above it (too tall).
  const [electricalExpanded, setElectricalExpanded] = useState(false)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const [leftColHeight, setLeftColHeight] = useState(0)
  const [rightColHeight, setRightColHeight] = useState(0)

  useEffect(() => {
    const leftEl = leftColRef.current
    const rightEl = rightColRef.current
    if (!leftEl || !rightEl) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === leftEl) setLeftColHeight(entry.contentRect.height)
        if (entry.target === rightEl) setRightColHeight(entry.contentRect.height)
      }
    })
    observer.observe(leftEl)
    observer.observe(rightEl)
    return () => observer.disconnect()
  }, [])

  const rowHeight = Math.max(leftColHeight, DIAGRAM_HEIGHT, rightColHeight)
  // Fills whatever the row currently is, so expanding the electrical card grows
  // the diagram with it instead of stranding it in a 330px dead gap.
  const diagramHeight = rowHeight - DIAGRAM_PADDING * 2

  return (
    <div className='w-full flex flex-col'>
      <div
        className='relative flex flex-col gap-3 md:min-h-(--electrical-min-h) transition-[min-height] duration-200'
        style={{ '--electrical-min-h': `${rowHeight}px` } as React.CSSProperties}
      >
        {/* Both floating columns are MapOverlayPanels: the diagram is this
            page's "map", so the navbar's focus toggle hides the cards sitting
            over it exactly like it does on the map pages. Wrapping them is
            also what REGISTERS the toggle — without a mounted consumer the
            navbar button stays gray ("หน้านี้ไม่มีแผนที่ให้เน้น").
            The measured ref stays on an inner plain div: MapOverlayPanel is a
            motion.div and doesn't forward refs, and its hidden state is a
            transform, which leaves layout height untouched — so hiding a side
            doesn't collapse the row out from under the diagram. */}
        <MapOverlayPanel position='left' className='w-full md:w-[429px] md:absolute md:top-0 md:left-0 md:z-10'>
          <div ref={leftColRef}>
            <RemoteControlCard />
          </div>
        </MapOverlayPanel>

        {/* Center — circuit diagram card. `flex-1` so it keeps growing to
            match however tall the row currently is (matching the left/right
            columns). No background fill — removing it means there's nothing
            to blend at the edges.

            The diagram gets an EXPLICIT height (diagramHeight) that tracks the
            row. This used to be capped at 550px on the theory that a taller
            w×h made the backend SVG's icons spread out and overlap; measuring
            the live endpoint shows that isn't what happens. The SVG's viewBox
            is a fixed `920 -540 1000 1040` REGARDLESS of the ?w=&h= params —
            those only size the container — and it has no preserveAspectRatio,
            so it uses the default `xMidYMid meet`: always uniform scale, always
            centered, never distorted. Measured scale is min(w/1000, h/1040),
            i.e. height-bound at every size this layout produces. The old cap
            therefore did the opposite of its stated intent — it pinned the
            diagram to the SMALLEST scale (550/1040 = 0.53) instead of letting
            it grow to fit (832/1040 = 0.80, ~51% larger).
            Extra height only stops helping past ~w*1.04 (where it flips to
            width-bound and just adds letterboxing) — far above anything the
            expanded rail produces, so no cap is needed. */}
        <div className='relative flex-1 w-full min-w-0 flex items-center justify-center p-6'>
          {imei ? (
            // `relative` here (not on the outer card) so MapEdgeFade's %-based
            // fade is computed against the diagram's OWN height, not the full
            // card — otherwise, once the card grows much taller than the
            // capped diagram, the fade lands mostly in the blank padding
            // instead of softening the diagram's own top/bottom edge.
            <div className='relative w-full' style={{ height: diagramHeight }}>
              <DiagramIframe imei={imei} minHeight={DIAGRAM_HEIGHT - DIAGRAM_PADDING * 2} className='h-full' />
              <MapEdgeFade left={10} right={10} top={10} bottom={10} />
            </div>
          ) : (
            <p className='text-white/50 fs-12 m-0 self-center'>ไม่มี IMEI — ไม่สามารถแสดงวงจรไฟฟ้าได้</p>
          )}
        </div>

        <MapOverlayPanel position='right' className='w-full md:w-[300px] md:absolute md:top-0 md:right-0 md:z-10'>
          <div ref={rightColRef}>
            <StatusCardsColumn
              electricalExpanded={electricalExpanded}
              onToggleElectricalExpanded={() => setElectricalExpanded((v) => !v)}
            />
          </div>
        </MapOverlayPanel>

        {/* Connection/circuit pair, relocated out of the right rail while the
            electrical card is expanded (StatusCardsColumn drops them then).
            Anchored bottom-left because that whole area is dead space: the
            left column is only ~170px tall against a row the expanded rail
            stretches to ~880px. Bottom-anchored + absolute means they consume
            no height of their own, so the row stays sized by the rail (880px)
            instead of the old rail + cards stack (1140px). Below `md` the
            absolute positioning is off and they simply flow last, which is
            where they already ended up when expanded. */}
        {electricalExpanded && (
          <MapOverlayPanel position='left' className='w-full md:w-auto md:absolute md:bottom-0 md:left-0 md:z-10'>
            <ConnectionCircuitCards direction='row' />
          </MapOverlayPanel>
        )}
      </div>
      <VoltageAmpChartsRow imei={imei} phase={project.phase} phaseReady={deviceLoaded} />
      <MapEventSection />
    </div>
  )
}

export default React.memo(OverviewSection)
