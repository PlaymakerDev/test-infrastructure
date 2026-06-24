"use client"
import * as echarts from "echarts"
import ReactECharts from "echarts-for-react"
import React, { useEffect, useMemo, useState } from "react"
import { PROVINCES } from "@/features/admin/dashboard/data/provinces"
import { useScope } from "../hooks/useScope"

export interface MapPoint {
  name: string // full Thai province name (matches the GeoJSON region)
  value: number
  // For region data: every province in a region carries the region's value;
  // groupName is the region label shown in the tooltip / used for drill-down.
  groupName?: string
}

// A metric the map can color by (Future #5: toggle CCTV vs lighting on one map).
export interface MapLayer {
  key: string
  label: string
  data: MapPoint[]
}

interface Props {
  layers: MapLayer[]
  /** Clicking an area asks a follow-up about it (drill-down) — province or region. */
  onSelectArea?: (name: string) => void
}

// The bundled GeoJSON only carries `code` (Thai abbreviation) + `nameEn`; join
// it to the project's province list to get the full Thai name that the backend
// uses as the result value, then register that as each region's name.
const CODE_TO_NAME = new Map(PROVINCES.map((p) => [p.code, p.name]))
export const PROVINCE_NAMES: ReadonlySet<string> = new Set(
  PROVINCES.map((p) => p.name),
)

interface GeoFeature {
  properties: { code: string; nameEn?: string; name?: string }
}
interface GeoJson {
  type: string
  features: GeoFeature[]
}

const ALL_MAP = "drr-th-all"
const SCOPE_MAP = "drr-th-scope"
type RegisterArg = Parameters<typeof echarts.registerMap>[1]

// Fetch + name the full GeoJSON once (~0.5 MB, lazy on first map render).
let geoPromise: Promise<GeoJson | null> | null = null
function loadFullGeo(): Promise<GeoJson | null> {
  if (!geoPromise) {
    geoPromise = fetch("/data/th-provinces.geojson")
      .then((r) => r.json())
      .then((geo: GeoJson) => {
        for (const f of geo.features) {
          f.properties.name =
            CODE_TO_NAME.get(f.properties.code) ??
            f.properties.nameEn ??
            f.properties.code
        }
        return geo
      })
      .catch(() => {
        geoPromise = null // allow a retry on the next render
        return null
      })
  }
  return geoPromise
}

// Register (once) a map containing only `provinces` (or all if null/empty) and
// return its name. ECharts auto-fits the geo to the registered features, so a
// scoped map focuses the viewport on the user's provinces (§5.1) and draws them
// even when they have no data row.
async function ensureMap(provinces: string[] | null): Promise<string | null> {
  const scoped = !!provinces && provinces.length > 0
  const name = scoped ? SCOPE_MAP : ALL_MAP
  if (echarts.getMap(name)) return name

  const geo = await loadFullGeo()
  if (!geo) return null

  const set = scoped ? new Set(provinces) : null
  const features = set
    ? geo.features.filter((f) => set.has(f.properties.name as string))
    : geo.features
  if (features.length === 0) {
    // Scoped set matched nothing — fall back to the whole country.
    if (!echarts.getMap(ALL_MAP)) {
      echarts.registerMap(ALL_MAP, geo as unknown as RegisterArg)
    }
    return ALL_MAP
  }

  echarts.registerMap(
    name,
    { type: "FeatureCollection", features } as unknown as RegisterArg,
  )
  return name
}

const Skeleton = () => (
  <div className="h-[380px] rounded-lg bg-white/5 animate-pulse" />
)

// Choropleth of Thai provinces (§6 map). FE only renders here when the backend
// signals chart.type === "map". The map is bounded to the user's scope (§5.1).
const MapView: React.FC<Props> = ({ layers, onSelectArea }) => {
  const { scope, loaded: scopeLoaded } = useScope()
  const [mapName, setMapName] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string>(() => layers[0]?.key ?? "")

  const active = useMemo(
    () => layers.find((l) => l.key === activeKey) ?? layers[0],
    [layers, activeKey],
  )
  const data = useMemo(() => active?.data ?? [], [active])
  const title = active?.label ?? ""

  useEffect(() => {
    if (!scopeLoaded) return
    let alive = true
    const provinces = scope?.scoped ? scope.provinces : null
    ensureMap(provinces).then((name) => {
      if (alive) setMapName(name)
    })
    return () => {
      alive = false
    }
  }, [scopeLoaded, scope])

  const option = useMemo(() => {
    if (!mapName) return null
    const values = data.map((d) => d.value)
    const min = values.length ? Math.min(...values) : 0
    const rawMax = values.length ? Math.max(...values) : 1
    const max = rawMax === min ? min + 1 : rawMax

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "#1e2533",
        borderColor: "#2e3a4e",
        borderWidth: 1,
        padding: [10, 16],
        textStyle: { color: "#ffffff", fontSize: 12 },
        formatter: (p: {
          name: string
          value: number
          data?: { groupName?: string }
        }) => {
          const label = p.data?.groupName ?? p.name
          return p.value == null || Number.isNaN(p.value)
            ? `${label}: ไม่มีข้อมูล`
            : `<span style="color:#8a9ab5">${label}</span> &nbsp; <b style="color:#FCD116">${Number(p.value).toLocaleString()}</b>`
        },
      },
      visualMap: {
        min,
        max,
        left: "left",
        bottom: 8,
        calculable: true,
        itemWidth: 12,
        itemHeight: 90,
        inRange: { color: ["#3b3413", "#8a7a1e", "#FCD116"] },
        textStyle: { color: "#8a9ab5", fontSize: 11 },
      },
      series: [
        {
          type: "map",
          map: mapName,
          roam: false,
          data,
          label: { show: false },
          itemStyle: {
            areaColor: "#1a2230", // provinces with no data row → "no data"
            borderColor: "#2e3a4e",
            borderWidth: 0.5,
          },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: "#66AEFF" },
          },
          select: { disabled: true },
        },
      ],
    }
  }, [data, mapName])

  return (
    <div
      className="relative rounded-2xl pt-5 px-5 pb-3 w-full overflow-hidden"
      style={{ background: "#00000080", border: "1px solid #1f2d3d" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <h2
          className="font-semibold leading-tight"
          style={{ color: "#FCD116", fontSize: 16 }}
        >
          {title}
        </h2>
        {layers.length > 1 && (
          <div className="inline-flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {layers.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setActiveKey(l.key)}
                className={`fs-12 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  active?.key === l.key
                    ? "bg-(--yellow) text-(--dark-black) font-medium"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {option ? (
        <ReactECharts
          option={option}
          style={{ height: 380 }}
          notMerge
          opts={{ renderer: "svg" }}
          onEvents={{
            click: (p: {
              componentType?: string
              name?: string
              data?: { groupName?: string }
            }) => {
              const area = p?.data?.groupName ?? p?.name
              if (p?.componentType === "series" && area) {
                onSelectArea?.(area)
              }
            },
          }}
        />
      ) : (
        <Skeleton />
      )}
    </div>
  )
}

export default React.memo(MapView)
