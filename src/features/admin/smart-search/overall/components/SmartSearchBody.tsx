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

  if (viewMode === "dashboard") {
    return (
      <div className="mt-2 flex-1 min-h-0">
        <PinnedDashboard />
      </div>
    )
  }

  if (viewMode === "compare") {
    return (
      <div className="mt-2 flex-1 min-h-0">
        <CompareView />
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
