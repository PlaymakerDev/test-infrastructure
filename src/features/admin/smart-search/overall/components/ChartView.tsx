"use client"
import dynamic from "next/dynamic"
import React, { useMemo } from "react"
import type { BarChartDataPoint } from "@/components/chart/Barchart"
import type { Cell, ChartHint, ResultPayload } from "@/types/chat"

// Code-split the ECharts wrappers — they (and ECharts) load only when a turn
// actually has a chart, keeping them out of the initial bundle.
const ChartSkeleton = () => (
  <div className="my-2 h-[220px] rounded-lg bg-white/5 animate-pulse" />
)
const BarChart = dynamic(() => import("@/components/chart/Barchart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
const LineChart = dynamic(() => import("@/components/chart/LineChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})

const PALETTE = ["#FCD116", "#66AEFF", "#52E04D", "#F4694E", "#a855f7", "#22d3ee"]

const toNumber = (value: Cell): number => {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

interface Props {
  chart: ChartHint
  result?: ResultPayload
}

interface Series {
  dataKey: string
  color: string
  label: string
}

// Renders bar/line charts only. metric → answered as text (no card); table → table only.
const ChartView: React.FC<Props> = ({ chart, result }) => {
  const model = useMemo(() => {
    if (!result || (chart.type !== "bar" && chart.type !== "line")) return null

    const { columns, rows } = result
    const xIdx = chart.x ? Math.max(0, columns.indexOf(chart.x)) : 0
    let yCols = (chart.y ?? []).filter((y) => columns.includes(y))
    if (yCols.length === 0) {
      yCols = columns.filter(
        (_, i) => i !== xIdx && rows.some((r) => typeof r[i] === "number"),
      )
    }
    if (yCols.length === 0) return null

    const data: BarChartDataPoint[] = rows.map((row) => {
      const point: BarChartDataPoint = { label: String(row[xIdx] ?? "") }
      for (const yc of yCols) point[yc] = toNumber(row[columns.indexOf(yc)])
      return point
    })
    const series: Series[] = yCols.map((yc, i) => ({
      dataKey: yc,
      color: PALETTE[i % PALETTE.length],
      label: yc,
    }))
    const title = yCols.length === 1 ? yCols[0] : "กราฟเปรียบเทียบ"

    return { kind: chart.type, data, series, title }
  }, [chart, result])

  if (!model) return null
  if (model.kind === "line") {
    return (
      <div className="my-2">
        <LineChart title={model.title} data={model.data} lines={model.series} height={220} />
      </div>
    )
  }
  return (
    <div className="my-2">
      <BarChart title={model.title} data={model.data} bars={model.series} height={220} />
    </div>
  )
}

export default React.memo(ChartView)
