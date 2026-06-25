"use client"
import React from "react"
import { useSmartSearchContext } from "../context"
import ChatWindow from "./ChatWindow"
import CompareView from "./CompareView"
import Composer from "./Composer"
import HistorySidebar from "./HistorySidebar"
import PinnedDashboard from "./PinnedDashboard"

// Switches the main area by view mode (chat / dashboard / compare). Lives inside
// the provider so it can read viewMode from context.
const SmartSearchBody: React.FC = () => {
  const { viewMode } = useSmartSearchContext()

  // Dashboard/compare align to the header: same px + a spacer matching the back
  // arrow's width (fs-24 → 1em) and the title's gap-3, so content starts exactly
  // at the "Smart Search" text and ends (flex-1) at the mode tabs' right edge.
  if (viewMode === "dashboard" || viewMode === "compare") {
    return (
      <div className="mt-2 flex-1 min-h-0 px-4 md:px-8 flex gap-3">
        <div aria-hidden className="fs-24 w-[1em] shrink-0" />
        <div className="flex-1 min-w-0 min-h-0">
          {viewMode === "dashboard" ? <PinnedDashboard /> : <CompareView />}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 flex-1 min-h-0 flex gap-4">
      <HistorySidebar />
      <section className="flex-1 min-w-0 flex flex-col min-h-0">
        <ChatWindow />
        <Composer />
      </section>
    </div>
  )
}

export default React.memo(SmartSearchBody)
