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

// /scope returns th.provinces.name_th, which *should* equal our canonical names
// but occasionally differs by whitespace, a "จังหวัด" prefix, or a Bangkok
// variant — those near-misses were what left holes when we filtered geometry by
// raw scope names. Normalize both sides to a comparable key and map back to the
// canonical GeoJSON name so every managed province resolves.
const normalizeProvince = (n: string): string =>
  n
    .trim()
    .replace(/\s+/g, "")
    .replace(/^จังหวัด/, "")
    .replace(/^(กรุงเทพมหานคร|กรุงเทพฯ)$/, "กรุงเทพ")
const NORM_TO_CANON = new Map(
  PROVINCES.map((p) => [normalizeProvince(p.name), p.name]),
)
// NOTE: `resolveManagedProvinces(scopeNames)` (canonicalize a /scope province
// list, dropping unmatched) was removed while the map is scoped by result rows
// instead of /scope — restore it alongside the FUTURE branch in `scopedSet` once
// the backend /scope endpoint returns the correct per-bureau provinces.
// Map a single (possibly loosely-named) province to its canonical GeoJSON name,
// falling back to the original if it can't be resolved. Applied to result rows
// so a value whose province name differs only by whitespace/prefix still lands
// on — and colors — the right region instead of dropping to "no data".
const toCanonicalProvince = (name: string): string =>
  NORM_TO_CANON.get(normalizeProvince(name)) ?? name

// Province centroids, used to focus (center + zoom) the map on the user's own
// provinces without registering a partial geometry — the whole country is
// always drawn (so nothing is ever a non-hoverable "hole"), and we just pan/zoom
// the viewport onto the managed area.
const PROVINCE_COORD = new Map(PROVINCES.map((p) => [p.name, p.coord]))
const COUNTRY_LNGS = PROVINCES.map((p) => p.coord[0])
const COUNTRY_LATS = PROVINCES.map((p) => p.coord[1])
const COUNTRY_W = Math.max(...COUNTRY_LNGS) - Math.min(...COUNTRY_LNGS)
const COUNTRY_H = Math.max(...COUNTRY_LATS) - Math.min(...COUNTRY_LATS)

// Compute a series-map center/zoom that frames `provinces`. Returns null for an
// empty set (→ caller leaves the whole country at default zoom).
function computeFocus(
  provinces: string[],
): { center: [number, number]; zoom: number } | null {
  const coords = provinces
    .map((n) => PROVINCE_COORD.get(n))
    .filter((c): c is [number, number] => !!c)
  if (coords.length === 0) return null
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
  // Centroids underestimate the true extent by ~half a province each side, so
  // pad before deriving a zoom, then clamp to a sane range.
  const w = (maxLng - minLng) * 1.6 || 1
  const h = (maxLat - minLat) * 1.6 || 1
  const zoom = Math.max(1, Math.min(COUNTRY_W / w, COUNTRY_H / h, 8))
  return { center, zoom }
}

interface GeoFeature {
  properties: { code: string; nameEn?: string; name?: string }
}
interface GeoJson {
  type: string
  features: GeoFeature[]
}

const ALL_MAP = "drr-th-all"
type RegisterArg = Parameters<typeof echarts.registerMap>[1]

// A stable, collision-free ECharts map name for a given province set, so two
// charts with different scopes never clobber each other's registered geometry.
function mapKey(provinces: string[] | null): string {
  if (!provinces || provinces.length === 0) return ALL_MAP
  const s = [...provinces].sort().join("|")
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return `drr-th-${(h >>> 0).toString(36)}`
}

// Fetch + name the full GeoJSON once (~0.5 MB, lazy on first map render).
let geoPromise: Promise<GeoJson | null> | null = null
function loadFullGeo(): Promise<GeoJson | null> {
  if (!geoPromise) {
    // Raw fetch is NOT basePath-prefixed by Next — carry it explicitly
    // ('/atlas' in prod/dev-with-env, '' otherwise).
    geoPromise = fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/th-provinces.geojson`)
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
// scoped map focuses the viewport on exactly those provinces. `provinces` is
// taken from the result rows themselves, whose names always match the GeoJSON
// (they're the same names that color successfully) — so the scoped map is never
// holey, unlike filtering by a separate /scope province-name list.
async function ensureMap(provinces: string[] | null): Promise<string | null> {
  const scoped = !!provinces && provinces.length > 0
  const name = mapKey(provinces)
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
// signals chart.type === "map". The whole country (all 77 provinces) is ALWAYS
// drawn, so no province is ever a non-hoverable hole. Scoping is expressed by
// framing (center + zoom onto the user's provinces via computeFocus), not by
// dropping geometry — an earlier attempt to register only the scoped subset left
// real holes wherever a scope name failed to resolve or a non-scoped province
// sat between scoped ones. Result-row names are canonicalized so their values
// always land on (and color) the right region.
const MapView: React.FC<Props> = ({ layers, onSelectArea }) => {
  const [mapName, setMapName] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0) // bump to retry a failed GeoJSON load
  const [activeKey, setActiveKey] = useState<string>(() => layers[0]?.key ?? "")
  const { scope } = useScope()

  const active = useMemo(
    () => layers.find((l) => l.key === activeKey) ?? layers[0],
    [layers, activeKey],
  )
  // Remap each result row's province name to its canonical GeoJSON name up front
  // so a name that differs only by whitespace/prefix still colors the right
  // region (raw mismatches were rendering as dark "no data" — the "ไม่ครบ" bug).
  const data = useMemo(
    () =>
      (active?.data ?? []).map((d) => ({
        ...d,
        name: toCanonicalProvince(d.name),
      })),
    [active],
  )
  const title = active?.label ?? ""

  // Canonical province names present in the result (always match the GeoJSON).
  const shownNames = useMemo(() => {
    const names = data.map((d) => d.name).filter((n) => PROVINCE_NAMES.has(n))
    return Array.from(new Set(names))
  }, [data])

  // The set of provinces this user is responsible for. null → show the whole
  // country.
  //
  // STOPGAP (backend /scope is wrong): GET /scope currently returns the wrong
  // province set for scoped accounts — e.g. a สำนัก-10 user (should be 4
  // provinces: เชียงใหม่/ลำปาง/ลำพูน/แม่ฮ่องสอน) gets 62 back. The RLS on the
  // result rows IS correct, so until /scope is fixed we scope the map to the
  // provinces the result actually covers. Restore the /scope-based line (see the
  // FUTURE comment) once the backend returns the right provinces.
  const scopedSet = useMemo<Set<string> | null>(() => {
    if (shownNames.length) return new Set(shownNames)
    return null
    // FUTURE (after backend /scope fix):
    //   if (!scope?.scoped) return null
    //   return new Set([...resolveManagedProvinces(scope.provinces), ...shownNames])
  }, [shownNames])

  // We ALWAYS draw all 77 provinces (so nothing is ever an unhoverable hole);
  // scoping is conveyed purely by framing the viewport (center + zoom) onto the
  // user's provinces, not by hiding geometry.
  const focus = useMemo(
    () => (scopedSet ? computeFocus(Array.from(scopedSet)) : null),
    [scopedSet],
  )

  // Dev-only diagnostic: surfaces exactly why a province might be missing —
  // whether /scope loaded, and any scope name that failed to resolve to a
  // canonical GeoJSON province. Check the browser console when debugging holes.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (!scope) {
      console.debug("[MapView] /scope not loaded → drawing whole country")
      return
    }
    const unresolved = scope.provinces.filter(
      (n) => !NORM_TO_CANON.get(normalizeProvince(n)),
    )
    // Raw result-row province names that don't resolve to a GeoJSON region even
    // after normalization — these are the rows that render as dark "no data".
    const rawDataNames = Array.from(new Set((active?.data ?? []).map((d) => d.name)))
    const unmatchedData = rawDataNames.filter((n) => !PROVINCE_NAMES.has(toCanonicalProvince(n)))
    console.debug("[MapView] scope", {
      scoped: scope.scoped,
      provinceCount: scope.provinces.length,
      provinces: scope.provinces,
      unresolvedScope: unresolved,
      dataProvinces: shownNames,
      unmatchedData,
    })
    if (unresolved.length) {
      console.warn("[MapView] scope provinces that did NOT match a GeoJSON province:", unresolved)
    }
    if (unmatchedData.length) {
      console.warn("[MapView] result-row provinces that did NOT match a GeoJSON province:", unmatchedData)
    }
  }, [scope, shownNames, active])

  // Dev-only on-screen debug badge — so a screenshot alone reveals why the
  // scoped map has a gap: which scope provinces failed to resolve to a GeoJSON
  // region (→ hidden as transparent = a hole where the user's own province
  // should be). Empty `unresolved` ⇒ the gap is a genuinely out-of-scope
  // province sitting inside the region.
  const debugInfo = useMemo(() => {
    if (process.env.NODE_ENV === "production" || !scope) return null
    const unresolved = scope.provinces.filter(
      (n) => !NORM_TO_CANON.get(normalizeProvince(n)),
    )
    return {
      scoped: scope.scoped,
      count: scope.provinces.length,
      resolvedCount: scope.provinces.length - unresolved.length,
      unresolved,
    }
  }, [scope])

  useEffect(() => {
    let alive = true
    ensureMap(null).then((name) => {
      if (!alive) return
      if (name) {
        setMapName(name)
        setFailed(false)
      } else {
        setFailed(true) // GeoJSON fetch failed — offer a retry
      }
    })
    return () => {
      alive = false
    }
  }, [attempt])

  const option = useMemo(() => {
    if (!mapName) return null
    const values = data.map((d) => d.value)
    const min = values.length ? Math.min(...values) : 0
    const rawMax = values.length ? Math.max(...values) : 1
    const max = rawMax === min ? min + 1 : rawMax

    // Every one of the 77 provinces gets an explicit data entry (drawing all 77
    // is what guarantees there are never unhoverable holes). Rows with a value
    // keep it. For the rest, the fill signals whether the province is the user's
    // responsibility — so a mostly-no-data scope still reads as "my area":
    //   • in-scope, no data → visible grey-blue (series `itemStyle` below)
    //   • out-of-scope      → a much darker fill (per-item, here)
    // Out-of-scope is dark but NOT transparent — transparent read as a hole.
    type FilledPoint = {
      name: string
      value: number | null
      groupName?: string
      itemStyle?: { areaColor: string; borderColor: string }
      emphasis?: { disabled: boolean }
    }
    const dataNames = new Set(data.map((d) => d.name))
    const filled: FilledPoint[] = [...data]
    for (const n of PROVINCE_NAMES) {
      if (dataNames.has(n)) continue
      if (scopedSet && !scopedSet.has(n)) {
        filled.push({
          name: n,
          value: null,
          itemStyle: { areaColor: "#12171f", borderColor: "#232c39" },
          emphasis: { disabled: true },
        })
      } else {
        filled.push({ name: n, value: null })
      }
    }

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "#1e2533",
        borderColor: "#2e3a4e",
        borderWidth: 1,
        padding: [10, 16],
        textStyle: { color: "#ffffff", fontSize: "var(--fs-12)" },
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
        inRange: { color: ["#7a6717", "#b89a20", "#FCD116"] },
        textStyle: { color: "#8a9ab5", fontSize: "var(--fs-12)" },
      },
      series: [
        {
          type: "map",
          map: mapName,
          roam: false,
          // Whole country is always drawn; for a scoped user we frame their
          // provinces via center/zoom (no partial geometry = no holes).
          ...(focus ? { center: focus.center, zoom: focus.zoom } : {}),
          data: filled,
          label: { show: false },
          itemStyle: {
            // Default (in-scope, no data): a visible grey-blue = "my area, no
            // devices". Out-of-scope provinces override this with a much darker
            // fill (set per-item above). All 77 are registered + present in
            // `data`, so every one hovers — no holes.
            areaColor: "#39465a",
            borderColor: "#5a6b82",
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
  }, [data, mapName, focus, scopedSet])

  return (
    <div
      className="relative rounded-2xl pt-5 px-5 pb-3 w-full overflow-hidden"
      style={{ background: "#00000080", border: "1px solid #1f2d3d" }}
    >
      {debugInfo && (
        <div className="absolute top-2 right-2 z-10 max-w-[280px] rounded-md bg-black/80 border border-white/15 px-2 py-1 text-[10px] leading-tight text-white/80">
          <div>
            scope: {String(debugInfo.scoped)} · {debugInfo.resolvedCount}/
            {debugInfo.count} resolved
          </div>
          {debugInfo.unresolved.length > 0 && (
            <div className="text-red-400">
              ไม่ match: {debugInfo.unresolved.join(", ")}
            </div>
          )}
        </div>
      )}
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
                className={`fs-12 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${active?.key === l.key
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
      ) : failed ? (
        <div className="h-[380px] flex flex-col items-center justify-center gap-3 text-center">
          <p className="fs-14 text-white/50">โหลดแผนที่ไม่สำเร็จ</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setAttempt((a) => a + 1)
            }}
            className="fs-12 px-3 py-1 rounded-md border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            ลองใหม่
          </button>
        </div>
      ) : (
        <Skeleton />
      )}
    </div>
  )
}

export default React.memo(MapView)
