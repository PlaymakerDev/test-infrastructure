import React from "react"
import { SmartSearchProvider } from "../context"
import { SmartSearchBody, TitleSection } from "../components"

const SmartSearchScreen: React.FC = () => {
  return (
    <SmartSearchProvider>
      <div className="w-full flex flex-col -mt-7 h-[calc(100vh-var(--nav-h))]">
        <TitleSection />
        <SmartSearchBody />
      </div>
    </SmartSearchProvider>
  )
}

export default React.memo(SmartSearchScreen)
