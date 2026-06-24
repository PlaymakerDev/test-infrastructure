"use client"
import { Skeleton } from "antd"
import React, { useState } from "react"
import { TbArrowUp } from "react-icons/tb"
import { askOnce } from "@/services/routes/ChatService"
import type { AskResult } from "@/types/chat"
import AnswerText from "./AnswerText"
import ConfidenceBadge from "./ConfidenceBadge"
import ProvenanceBadge from "./ProvenanceBadge"
import ResultViews from "./ResultViews"

interface PaneState {
  loading: boolean
  result?: AskResult
  error?: boolean
}

const ComparePane: React.FC<{ placeholder: string }> = ({ placeholder }) => {
  const [query, setQuery] = useState("")
  const [state, setState] = useState<PaneState>({ loading: false })

  const run = async () => {
    const q = query.trim()
    if (!q || state.loading) return
    setState({ loading: true })
    try {
      const result = await askOnce(q)
      setState({ loading: false, result })
    } catch {
      setState({ loading: false, error: true })
    }
  }

  const { loading, result, error } = state

  return (
    <div className="flex flex-col gap-3 min-w-0 h-full">
      <div className="shrink-0 rounded-xl bg-black border border-white/10 focus-within:border-(--yellow)/50 transition-colors px-3 py-2 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run()
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none border-none fs-14 text-white placeholder-white/40"
        />
        <button
          type="button"
          aria-label="ถาม"
          onClick={run}
          disabled={!query.trim() || loading}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            query.trim() && !loading
              ? "bg-(--yellow) text-(--dark-black) hover:bg-(--yellow)/90 cursor-pointer"
              : "bg-[#3A3A3A] text-white/50 cursor-not-allowed"
          }`}
        >
          <TbArrowUp size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : error ? (
          <p className="fs-14 text-red-400">ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง</p>
        ) : result ? (
          <div className="flex flex-col">
            {result.result && result.result.row_count > 0 && (
              <ResultViews
                chart={result.chart}
                result={result.result}
                truncated={result.provenance?.truncated}
              />
            )}
            {result.answer && <AnswerText text={result.answer} />}
            {result.confidence && (
              <div className="mt-2">
                <ConfidenceBadge confidence={result.confidence} />
              </div>
            )}
            {result.provenance && <ProvenanceBadge provenance={result.provenance} />}
          </div>
        ) : (
          <p className="fs-14 text-white/35">พิมพ์คำถามด้านบนเพื่อเทียบผลลัพธ์</p>
        )}
      </div>
    </div>
  )
}

// Side-by-side compare (Future #3) — two independent one-shot asks. Fits the
// domain's comparison questions ("เทียบจังหวัด A กับ B").
const CompareView: React.FC = () => {
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 px-2 pb-2">
      <ComparePane placeholder="คำถามที่ 1..." />
      <ComparePane placeholder="คำถามที่ 2..." />
    </div>
  )
}

export default React.memo(CompareView)
