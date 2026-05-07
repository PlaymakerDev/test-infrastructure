"use client"
import React, { memo, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { TbCarCrash } from 'react-icons/tb'
import Tabs from './Tabs'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const INCIDENT_DATA = [
  { m: "ม.ค.", v: 8200 },
  { m: "ก.พ.", v: 11500 },
  { m: "มี.ค.", v: 142967 },
  { m: "เม.ย.", v: 9800 },
  { m: "พ.ค.", v: 13200 },
  { m: "มิ.ย.", v: 15400 },
  { m: "ก.ค.", v: 18900 },
  { m: "ส.ค.", v: 14200 },
  { m: "ก.ย.", v: 11000 },
  { m: "ต.ค.", v: 12500 },
  { m: "พ.ย.", v: 10800 },
  { m: "ธ.ค.", v: 9100 },
]

const INCIDENT_OPTION = {
  backgroundColor: "transparent",
  grid: { top: 60, right: 16, bottom: 28, left: 16, containLabel: true },
  xAxis: {
    type: "category",
    data: INCIDENT_DATA.map((d) => d.m),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "#6b7f9a", fontSize: 11 },
    splitLine: {
      show: true,
      lineStyle: { color: "rgba(255,255,255,0.08)", width: 1 },
    },
  },
  yAxis: {
    type: "value",
    show: false,
    splitLine: { show: false },
  },
  series: [
    {
      type: "line",
      data: INCIDENT_DATA.map((d) => d.v),
      smooth: 0.5,
      symbol: "circle",
      symbolSize: 10,
      showSymbol: false,
      lineStyle: { color: "#FCD116", width: 3 },
      itemStyle: { color: "#fff", borderColor: "#FCD116", borderWidth: 2 },
      markPoint: {
        data: [{ type: "max", name: "สูงสุด" }],
        symbol: "circle",
        symbolSize: 12,
        itemStyle: { color: "#fff", borderColor: "#FCD116", borderWidth: 2 },
        label: {
          show: true,
          position: "top",
          distance: 16,
          formatter: (p: { value: number }) =>
            `{val|${p.value.toLocaleString()}}\n{sub|เหตุการณ์}`,
          rich: {
            val: {
              backgroundColor: "#FCD116",
              borderRadius: 6,
              padding: [6, 10, 2, 10],
              color: "#050d1a",
              fontSize: 13,
              fontWeight: "bold",
              lineHeight: 20,
            },
            sub: {
              backgroundColor: "#FCD116",
              borderRadius: 6,
              padding: [2, 10, 6, 10],
              color: "#050d1a",
              fontSize: 11,
              lineHeight: 18,
            },
          },
        },
      },
    },
  ],
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(5,13,26,0.92)",
    borderColor: "rgba(252,209,22,0.3)",
    textStyle: { color: "#FCD116", fontSize: 11 },
    formatter: (p: Array<{ name: string; value: number }>) =>
      `${p[0].name}: <b>${p[0].value.toLocaleString()}</b> เหตุการณ์`,
  },
}

const IncidentEChart = memo(function IncidentEChart() {
  return (
    <ReactECharts
      option={INCIDENT_OPTION}
      notMerge={false}
      style={{ width: "100%", height: 196 }}
      opts={{ renderer: "canvas" }}
    />
  )
})

const TAB_OPTIONS = ["วันนี้", "เดือน", "ปี"]

interface Props {}

const AccidentChart: React.FC<Props> = () => {
  const [tab, setTab] = useState("เดือน")

  const decoLayers = useMemo(
    () => (
      <>
        <div
          className="absolute pointer-events-none"
          style={{
            width: 207,
            height: 207,
            left: -104,
            top: -80,
            background: "rgba(252,209,22,0.3)",
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 112,
            height: 112,
            right: 40,
            top: -30,
            background: "rgba(252,209,22,0.3)",
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 235,
            height: 235,
            right: -40,
            bottom: -60,
            background: "rgba(0,0,0,0.5)",
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
        />
      </>
    ),
    []
  )

  return (
    <div
      className="relative overflow-hidden p-3"
      style={{
        background: "rgba(0,0,0,0.55)",
        borderRadius: 20,
        backdropFilter: "blur(5px)",
      }}
    >
      {decoLayers}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <TbCarCrash size={30} color="#FCD116" />
          ปริมาณการเกิดอุบัติเหตุ
        </div>
        <Tabs value={tab} onChange={setTab} options={TAB_OPTIONS} />
      </div>
      <div className="relative z-10">
        <IncidentEChart />
      </div>
    </div>
  )
}

export default React.memo<Props>(AccidentChart)
