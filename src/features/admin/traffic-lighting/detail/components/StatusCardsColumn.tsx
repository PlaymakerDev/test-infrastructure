"use client"
import React from 'react'
import ElectricalSystemCard from './ElectricalSystemCard'
import ConnectionCircuitCards from './ConnectionCircuitCards'

interface Props {
  /** Controlled by OverviewSection so it can grow the surrounding layout
   *  instead of ElectricalSystemCard overlapping the content below it. */
  electricalExpanded: boolean
  onToggleElectricalExpanded: () => void
}

/** Right column — electrical card + connection/circuit status for the OVERVIEW tab. */
const StatusCardsColumn: React.FC<Props> = ({ electricalExpanded, onToggleElectricalExpanded }) => (
  <div className='flex flex-col gap-2.5 w-full md:w-[300px] shrink-0 md:self-start'>
    <ElectricalSystemCard expanded={electricalExpanded} onToggleExpanded={onToggleElectricalExpanded} />

    {/* Expanding the electrical card adds ~530px of per-phase readings, which
        used to push these two down to ~y1200 — off-screen — and stretched the
        whole row to 1140px against a diagram capped at 550px. While expanded
        OverviewSection renders them in the empty bottom-left corner instead;
        they only belong to this rail in the collapsed state. */}
    {!electricalExpanded && <ConnectionCircuitCards />}
  </div>
)

export default React.memo(StatusCardsColumn)
