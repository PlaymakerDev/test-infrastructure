"use client"
import React, { useState } from "react"
import { TbBrandGithubCopilot, TbLayoutGrid } from "react-icons/tb"
import { useSmartSearchContext } from "../context"
import { SUGGESTED_PROMPTS } from "../data/suggestedPrompts"
import InsightsPanel from "./InsightsPanel"
import PromptGallery from "./PromptGallery"

const EmptyState: React.FC = () => {
  const { send, isStreaming } = useSmartSearchContext()
  const [galleryOpen, setGalleryOpen] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center text-center gap-4 px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <TbBrandGithubCopilot className="text-white" size={56} />
        <div className="max-w-xl">
          <p className="text-white/80 text-lg">
            พิมพ์คำถามเกี่ยวกับข้อมูลจราจรหรือถนนเป็นภาษาไทยหรืออังกฤษ
          </p>
          <p className="text-white/50 fs-14 mt-1">
            ระบบจะประมวลผลและสร้างผลลัพธ์ให้แบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isStreaming}
              onClick={() => send(prompt)}
              className="fs-14 px-4 py-2 rounded-full border border-(--yellow)/40 text-white/80 hover:border-(--yellow) hover:text-(--yellow) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="fs-14 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            <TbLayoutGrid size={15} /> คลังคำถาม
          </button>
        </div>

        <InsightsPanel />
      </div>

      <PromptGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  )
}

export default React.memo(EmptyState)
