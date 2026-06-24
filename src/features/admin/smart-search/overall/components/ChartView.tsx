"use client"
import dynamic from "next/dynamic"
import React, { useMemo } from "react"
import type { BarChartDataPoint } from "@/components/chart/Barchart"
import type { Cell, ChartHint, ResultPayload } from "@/types/chat"
import { useSmartSearchContext } from "../context"
import { REGION_NAMES, REGION_TO_PROVINCES } from "../data/regionProvinces"
import type { MapPoint } from "./MapView"
import { PROVINCE_NAMES } from "./MapView"

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
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="my-2 h-[380px] rounded-lg bg-white/5 animate-pulse" />,
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

// Renders bar/line/map. metric → answered as text (no card); table → table only.
// The backend picks the type; the FE just renders it. For "map" we render a
// province choropleth when the x values are Thai provinces, otherwise we fall
// back to a bar chart (e.g. region data has no province geometry).
const ChartView: React.FC<Props> = ({ chart, result }) => {
  const { send } = useSmartSearchContext()

  const model = useMemo(() => {
    const renderable =
      chart.type === "bar" || chart.type === "line" || chart.type === "map"
    if (!result || !renderable) return null

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

    if (chart.type === "map") {
      const yc = yCols[0]
      const ycIdx = columns.indexOf(yc)

      // Province rows → one point per province.
      const provincePoints: MapPoint[] = rows
        .map((row) => ({
          name: String(row[xIdx] ?? "").trim(),
          value: toNumber(row[ycIdx]),
        }))
        .filter((p) => PROVINCE_NAMES.has(p.name))
      if (provincePoints.length > 0)
        return { kind: "map" as const, mapData: provincePoints, title: yc }

      // Region rows → expand each region to its provinces (all share the value).
      const regionPoints: MapPoint[] = rows.flatMap((row) => {
        const region = String(row[xIdx] ?? "").trim()
        const provinces = REGION_TO_PROVINCES[region]
        if (!provinces) return []
        const value = toNumber(row[ycIdx])
        return provinces.map((name) => ({ name, value, groupName: region }))
      })
      if (regionPoints.length > 0)
        return { kind: "map" as const, mapData: regionPoints, title: yc }

      // Neither province nor region (no geometry) → fall back to bar.
      return { kind: "bar" as const, data, series, title }
    }

    return { kind: chart.type, data, series, title }
  }, [chart, result])

  if (!model) return null

  if (model.kind === "map") {
    return (
      <div className="my-2">
        <MapView
          title={model.title}
          data={model.mapData}
          onSelectArea={(name) =>
            send(
              REGION_NAMES.has(name)
                ? `ขอรายละเอียด${model.title}ของ${name}`
                : `ขอรายละเอียด${model.title}ของจังหวัด${name}`,
            )
          }
        />
      </div>
    )
  }
  // Chat charts get arbitrary, often-long category labels (full road names) —
  // keep them horizontal but truncate with … so they don't overlap; the full
  // text shows in the tooltip on hover.
  if (model.kind === "line") {
    return (
      <div className="my-2">
        <LineChart
          title={model.title}
          data={model.data}
          lines={model.series}
          height={220}
          xAxisLabelMaxWidth={80}
        />
      </div>
    )
  }
  return (
    <div className="my-2">
      <BarChart
        title={model.title}
        data={model.data}
        bars={model.series}
        height={220}
        xAxisLabelMaxWidth={80}
      />
    </div>
  )
}

export default React.memo(ChartView)
