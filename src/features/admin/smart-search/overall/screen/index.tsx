import React from "react"
import { SmartSearchProvider } from "../context"
import { ChatWindow, Composer, HistorySidebar, TitleSection } from "../components"

const SmartSearchScreen: React.FC = () => {
  return (
    <SmartSearchProvider>
      <div className="main-screen flex flex-col h-[calc(100vh-var(--nav-offset))]">
        <TitleSection />
        <div className="mt-4 flex-1 min-h-0 flex gap-4">
          <HistorySidebar />
          <section className="flex-1 min-w-0 flex flex-col min-h-0">
            <ChatWindow />
            <Composer />
          </section>
        </div>
      </div>
    </SmartSearchProvider>
  )
}

export default React.memo(SmartSearchScreen)
