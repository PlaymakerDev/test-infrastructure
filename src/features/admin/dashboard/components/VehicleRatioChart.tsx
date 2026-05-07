"use client"
import React, { memo, useState } from 'react'
import dynamic from 'next/dynamic'
import { TbCar } from 'react-icons/tb'
import Tabs from './Tabs'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const VEHICLES = [
  { name: "รถยนต์",         count: 515208, pct: 41, color: "#f87171" },
  { name: "รถจักรยานยนต์",  count: 235138, pct: 20, color: "#34d399" },
  { name: "รถกระบะ",        count: 165109, pct: 17, color: "#60a5fa" },
  { name: "รถบรรทุก",       count:  37934, pct: 12, color: "#7dd3fc" },
  { name: "รถพ่วง",         count:  19200, pct:  6, color: "#fbbf24" },
  { name: "รถแท็กซี่",      count:   2203, pct:  3, color: "#a3e635" },
  { name: "รถบัส",          count:   1482, pct:  1, color: "#c084fc" },
]

const TOTAL_COUNT = VEHICLES.reduce((sum, v) => sum + v.count, 0)

const ROSE_OPTION = {
  backgroundColor: "transparent",
  // 88% radius — fill the (now-square) container; a bit of padding for axis labels
  polar: { center: ["50%", "50%"], radius: ["0%", "88%"] },
  angleAxis: {
    type: "category",
    data: VEHICLES.map((d) => d.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false },
  },
  radiusAxis: {
    type: "value",
    // Largest bar is ~515k → max 600k makes the biggest sector reach ~85% of polar
    // (was 700k which left big visual gap)
    max: 600000,
    interval: 100000,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      show: true,
      color: "rgba(255,255,255,0.7)",
      fontSize: 9,
      formatter: (v: number) =>
        v > 0
          ? `${Math.round(v / 1000) * 1000 === v ? v.toLocaleString() : ""}`
          : "",
    },
    splitLine: {
      lineStyle: { color: "rgba(255,255,255,0.15)", width: 0.8 },
    },
  },
  series: [
    {
      type: "bar",
      data: VEHICLES.map((d) => ({
        value: d.count,
        itemStyle: { color: d.color, opacity: 0.85, borderRadius: 4 },
      })),
      coordinateSystem: "polar",
      roundCap: true,
      barMaxWidth: 38,
    },
  ],
  tooltip: {
    show: true,
    backgroundColor: "rgba(5,13,26,0.92)",
    borderColor: "rgba(252,209,22,0.3)",
    textStyle: { color: "#FCD116", fontSize: 12 },
    formatter: (p: { name: string; value: number }) =>
      `${p.name}<br/><b>${p.value.toLocaleString()}</b>`,
  },
}

const RoseEChart = memo(function RoseEChart() {
  return (
    <ReactECharts
      option={ROSE_OPTION}
      notMerge={false}
      // Fill the parent — the parent decides the actual size (square wrapper).
      style={{ width: "100%", height: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  )
})

const TAB_OPTIONS = ["วันนี้", "เดือน", "ปี"]

interface Props {
  /** Extra utility classes for the outer card — e.g. "flex-1 min-h-0" to fill a flex parent */
  className?: string
}

const VehicleRatioChart: React.FC<Props> = ({ className = '' }) => {
  const [tab, setTab] = useState("วันนี้")

  return (
    <div
      className={`flex flex-col p-3 ${className}`}
      style={{
        background: "rgba(0,0,0,0.55)",
        borderRadius: 20,
        backdropFilter: "blur(5px)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-white text-sm font-medium">
          <TbCar size={30} color="#FCD116" />
          สัดส่วนยานพาหนะ
        </div>
        <Tabs value={tab} onChange={setTab} options={TAB_OPTIONS} />
      </div>
      {/*
       * Mobile (default): width-based square — `w-full max-w-[280px]` so the rose
       *   matches the card width without `grow` (which can't apply when the card
       *   has no fixed height in the scrollable mobile column).
       * Desktop (sm+): height-based square — `h-full` lets the card's flex-1
       *   space fill the chart, and aspect-square keeps it round.
       */}
      <div className="flex items-center justify-center grow min-h-0">
        <div className="aspect-square w-full max-w-[280px] mx-auto sm:w-auto sm:h-full sm:max-w-90 sm:max-h-90">
          <RoseEChart />
        </div>
      </div>
      <div className="px-14">
        {VEHICLES.map((d) => (
          <div
            key={d.name}
            className="flex items-center text-sm"
            style={{ paddingTop: 5, paddingBottom: 5 }}
          >
            <div
              className="size-2.5 rounded-full shrink-0 mr-2"
              style={{ background: d.color }}
            />
            <span className="text-white">{d.name}</span>
            <span className="flex-1" />
            <span className="text-white font-medium tabular-nums w-20 text-right">
              {d.count.toLocaleString()}
            </span>
            <span className="text-white w-14 text-right tabular-nums">{d.pct}%</span>
          </div>
        ))}
        <div
          className="flex items-center text-sm border-t"
          style={{
            paddingTop: 5,
            paddingBottom: 5,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="size-2.5 shrink-0 mr-2" />
          <span className="text-(--yellow) font-semibold">รวม</span>
          <span className="flex-1" />
          <span className="text-(--yellow) font-bold tabular-nums w-20 text-right">
            {TOTAL_COUNT.toLocaleString()}
          </span>
          <span className="w-14" />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(VehicleRatioChart)
