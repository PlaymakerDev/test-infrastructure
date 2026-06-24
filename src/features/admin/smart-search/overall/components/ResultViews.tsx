"use client"
import React, { useMemo, useState } from "react"
import { TbChartBar, TbMap2, TbTable } from "react-icons/tb"
import type { ChartHint, ResultPayload } from "@/types/chat"
import { REGION_NAMES } from "../data/regionProvinces"
import ChartView from "./ChartView"
import { PROVINCE_NAMES } from "./MapView"
import ResultTable from "./ResultTable"

type ViewKey = "map" | "chart" | "table"

interface Props {
  chart?: ChartHint
  result: ResultPayload
  truncated?: boolean
}

const VIEW_META: Record<ViewKey, { label: string; icon: React.ReactNode }> = {
  map: { label: "แผนที่", icon: <TbMap2 size={14} /> },
  chart: { label: "กราฟ", icon: <TbChartBar size={14} /> },
  table: { label: "ตาราง", icon: <TbTable size={14} /> },
}

// Does the area column hold provinces or regions? → a choropleth is possible.
function hasMapData(
  chart: ChartHint | undefined,
  result: ResultPayload,
): boolean {
  if (chart?.type !== "map") return false
  const xIdx = chart.x ? Math.max(0, result.columns.indexOf(chart.x)) : 0
  return result.rows.some((r) => {
    const area = String(r[xIdx] ?? "").trim()
    return PROVINCE_NAMES.has(area) || REGION_NAMES.has(area)
  })
}

// One result, multiple ways to look at it — table ↔ chart ↔ map (§6). The
// backend's suggested type is the default (map > chart > table); the user can
// switch. Replaces stacking chart + table so a turn stays compact.
const ResultViews: React.FC<Props> = ({ chart, result, truncated }) => {
  const views = useMemo<ViewKey[]>(() => {
    const t = chart?.type
    const chartable = t === "bar" || t === "line" || t === "map"
    const list: ViewKey[] = []
    if (hasMapData(chart, result)) list.push("map")
    if (chartable) list.push("chart")
    list.push("table")
    return list
  }, [chart, result])

  // Until the user picks, follow the backend's default (views[0], the richest
  // available). Recomputed as frames arrive, so a late `chart` frame still
  // promotes the default to map/chart without overriding a manual choice.
  const [userChoice, setUserChoice] = useState<ViewKey | null>(null)
  const current =
    userChoice && views.includes(userChoice) ? userChoice : views[0]

  const chartForView = useMemo<ChartHint | undefined>(() => {
    if (!chart) return undefined
    if (current === "map") return { ...chart, type: "map" }
    if (current === "chart")
      return { ...chart, type: chart.type === "line" ? "line" : "bar" }
    return chart
  }, [chart, current])

  return (
    <div className="my-2">
      {views.length > 1 && (
        <div className="inline-flex items-center gap-1 rounded-lg bg-white/5 p-1 mb-1">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setUserChoice(v)}
              className={`flex items-center gap-1.5 fs-12 px-3 py-1 rounded-md transition-colors cursor-pointer ${current === v
                ? "bg-(--yellow) text-(--dark-black) font-medium"
                : "text-white/55 hover:text-white"
                }`}
            >
              {VIEW_META[v].icon}
              {VIEW_META[v].label}
            </button>
          ))}
        </div>
      )}

      {current === "table" ? (
        <ResultTable result={result} truncated={truncated} />
      ) : (
        chartForView && <ChartView chart={chartForView} result={result} />
      )}
    </div>
  )
}

export default React.memo(ResultViews)
