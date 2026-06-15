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
  result: ResultPayload
  chart: ChartHint
}

interface Series {
  dataKey: string
  color: string
  label: string
}

const MetricCard: React.FC<{ value: Cell; label: string }> = ({ value, label }) => (
  <div className="my-2 rounded-lg border border-[#1f2d3d] bg-[#00000080] px-5 py-4">
    <p className="fs-12 text-white/60">{label}</p>
    <p className="text-(--yellow) text-3xl font-semibold mt-1">
      {typeof value === "number" ? value.toLocaleString("en-US") : String(value ?? "—")}
    </p>
  </div>
)

const ChartView: React.FC<Props> = ({ result, chart }) => {
  const { columns, rows } = result

  const model = useMemo(() => {
    if (chart.type === "metric") {
      const yCol = chart.y?.[0]
      const colIdx = yCol ? columns.indexOf(yCol) : -1
      const value = colIdx >= 0 ? rows[0]?.[colIdx] : rows[0]?.[0]
      return { kind: "metric" as const, value: value ?? null, label: yCol ?? columns[0] ?? "" }
    }

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
  }, [chart, columns, rows])

  if (!model) return null
  if (model.kind === "metric") {
    return <MetricCard value={model.value} label={model.label} />
  }
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
