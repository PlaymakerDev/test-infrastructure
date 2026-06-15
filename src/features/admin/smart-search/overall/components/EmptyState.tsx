"use client"
import React from "react"
import { TbBrandGithubCopilot } from "react-icons/tb"
import { useSmartSearchContext } from "../context"
import { SUGGESTED_PROMPTS } from "../data/suggestedPrompts"
import InsightsPanel from "./InsightsPanel"

const EmptyState: React.FC = () => {
  const { send, isStreaming } = useSmartSearchContext()

  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-6 px-6">
      <TbBrandGithubCopilot className="fs-24 cursor-pointer" size={96} />
      <div className="max-w-xl">
        <p className="text-white/70">
          พิมพ์คำถามเกี่ยวกับข้อมูลจราจรหรือถนนเป็นภาษาไทยหรืออังกฤษ
        </p>
        <p className="text-white/50 fs-14">
          ระบบจะประมวลผลและสร้างผลลัพธ์ให้แบบเรียลไทม์
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isStreaming}
            onClick={() => send(prompt)}
            className="fs-14 px-4 py-2 rounded-full border border-(--yellow)/40 text-white/80 hover:border-(--yellow) hover:text-(--yellow) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      <InsightsPanel />
    </div>
  )
}

export default React.memo(EmptyState)
