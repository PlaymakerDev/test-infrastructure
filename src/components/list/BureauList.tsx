"use client"
import { Badge, Button, Checkbox, ConfigProvider, Tooltip } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TbChevronDown, TbChevronRight, TbEye } from 'react-icons/tb'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { BureauItem, BureauState, BureauRoute, BureauSign, BureauSelection } from '@/types/control-vms/bureau'

// Re-export so consumers importing from '@/components/list' keep working.
export type { BureauItem, BureauState, BureauRoute, BureauSign, BureauSelection }

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BureauListProps {
  data: BureauItem[]

  onSelectionChange?: (selection: BureauSelection) => void
  onSelectModeChange?: (active: boolean) => void
  defaultCheckedKeys?: string[]
  defaultSelectMode?: boolean
  defaultExpandAll?: boolean

  onBureauClick?: (bureau: BureauItem) => void
  onStateClick?: (state: BureauState, bureau: BureauItem) => void
  onRouteClick?: (route: BureauRoute, state: BureauState, bureau: BureauItem) => void
  onSignClick?: (sign: BureauSign, route: BureauRoute, state: BureauState, bureau: BureauItem) => void

  showControls?: boolean

  /** Command Center mode — checkboxes always visible; "ยกเลิกทั้งหมด" clears
   *  ticks but doesn't hide the checkboxes. */
  alwaysSelectMode?: boolean
  /** When alwaysSelectMode, whether "เลือกทั้งหมด" requires has_valid_agent
   *  (real, correctly-versioned agent — online or offline, just not "never
   *  provisioned"). Default true. Online/offline eligibility itself is NOT
   *  filtered here — that distinction is surfaced once, visibly, by
   *  LiveMonitor's bucket chips after selection; pre-filtering it here too
   *  was confusing double-filtering ("why didn't select-all select all?"). */
  requireValidAgentOnSelectAll?: boolean

  /** Hide the sign-level leaves under each route — the tree stops at
   *  route. Ticking a route still cascades to every sign under it (so
   *  selection.signs remains complete for downstream consumers), the
   *  leaves are just not rendered. Used by the Status tab where each
   *  sign already has its own row + expandable HLS preview on the
   *  right, making the sidebar preview redundant. */
  hideSignLeaves?: boolean

  /** When set, renders an eye icon next to each sign's status badge that
   *  opens the caller's sign-detail view (same modal LiveMonitor's cards
   *  use) instead of requiring the operator to select the sign first. */
  onViewSign?: (sign: BureauSign) => void
}

// ---------------------------------------------------------------------------
// Key helpers — all IDs are numbers in the API; convert to strings for sets
// ---------------------------------------------------------------------------

const bureauKey = (b: BureauItem) => String(b.department_id)
const stateKey = (b: BureauItem, s: BureauState) =>
  `${bureauKey(b)}-${s.department_id}`
const routeKey = (b: BureauItem, s: BureauState, r: BureauRoute) =>
  `${stateKey(b, s)}-${r.road_id}`
const signKey = (b: BureauItem, s: BureauState, r: BureauRoute, sol: BureauSign) =>
  `${routeKey(b, s, r)}-${sol.solution_id}`

const routeOnline = (r: BureauRoute) =>
  r.solution.reduce((sum, s) => sum + s.camera_online_count, 0)
const routeOffline = (r: BureauRoute) =>
  r.solution.reduce((sum, s) => sum + s.camera_offline_count, 0)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
  setter(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    return next
  })
}

// requireValidAgent = true skips signs with no real/correctly-versioned agent
// (has_valid_agent false — never provisioned, or version below threshold) at
// the leaf, and prunes empty parent aggregate keys (bureau/state/route) so
// their tri-state checkbox isn't stuck "checked" while no leaf is picked.
// false collects every sign, including ones with no agent at all. Deliberately
// NOT filtering on is_online/is_controllable here — a sign with a valid agent
// that's merely offline right now is still worth selecting (queue-ahead);
// LiveMonitor's bucket chips show that distinction after selection, once,
// instead of the tree silently pre-filtering it.
const getAllKeys = (data: BureauItem[], requireValidAgent = true): Set<string> => {
  const keys = new Set<string>()
  for (const bureau of data) {
    let bureauHasAny = false
    for (const state of bureau.sub_department || []) {
      const sk = stateKey(bureau, state)
      let stateHasAny = false
      for (const route of state.roads || []) {
        const rk = routeKey(bureau, state, route)
        let routeHasAny = false
        for (const sign of route.solution || []) {
          if (requireValidAgent && !sign.has_valid_agent) continue
          keys.add(signKey(bureau, state, route, sign))
          routeHasAny = true
        }
        if (routeHasAny) {
          keys.add(rk)
          stateHasAny = true
        }
      }
      if (stateHasAny) {
        keys.add(sk)
        bureauHasAny = true
      }
    }
    if (bureauHasAny) keys.add(bureauKey(bureau))
  }
  return keys
}

// Descendant keys for cascading checkbox selection — checking/unchecking a
// parent applies the same state to every key below it in the tree.
const getRouteDescendantKeys = (bureau: BureauItem, state: BureauState, route: BureauRoute): string[] =>
  (route.solution || []).map(sign => signKey(bureau, state, route, sign))

const getStateDescendantKeys = (bureau: BureauItem, state: BureauState): string[] => {
  const keys: string[] = []
  for (const route of state.roads || []) {
    keys.push(routeKey(bureau, state, route))
    keys.push(...getRouteDescendantKeys(bureau, state, route))
  }
  return keys
}

const getBureauDescendantKeys = (bureau: BureauItem): string[] => {
  const keys: string[] = []
  for (const state of bureau.sub_department || []) {
    keys.push(stateKey(bureau, state))
    keys.push(...getStateDescendantKeys(bureau, state))
  }
  return keys
}

const getExpandKeys = (data: BureauItem[]) => {
  const bureauKeys = new Set<string>()
  const stateKeys = new Set<string>()
  const routeKeys = new Set<string>()
  for (const bureau of data) {
    bureauKeys.add(bureauKey(bureau))
    for (const state of bureau.sub_department || []) {
      const sk = stateKey(bureau, state)
      stateKeys.add(sk)
      for (const route of state.roads || []) {
        routeKeys.add(routeKey(bureau, state, route))
      }
    }
  }
  return { bureauKeys, stateKeys, routeKeys }
}

const buildSelection = (data: BureauItem[], checkedKeys: Set<string>): BureauSelection => {
  const bureaus: BureauItem[] = []
  const states: BureauState[] = []
  const routes: BureauRoute[] = []
  const signs: BureauSign[] = []
  for (const bureau of data) {
    if (checkedKeys.has(bureauKey(bureau))) bureaus.push(bureau)
    for (const state of bureau.sub_department || []) {
      const sk = stateKey(bureau, state)
      if (checkedKeys.has(sk)) states.push(state)
      for (const route of state.roads || []) {
        const rk = routeKey(bureau, state, route)
        if (checkedKeys.has(rk)) routes.push(route)
        for (const sign of route.solution || []) {
          if (checkedKeys.has(signKey(bureau, state, route, sign))) signs.push(sign)
        }
      }
    }
  }
  return { keys: Array.from(checkedKeys), bureaus, states, routes, signs }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BureauList: React.FC<BureauListProps> = (props) => {
  const {
    data,
    onSelectionChange,
    onSelectModeChange,
    defaultCheckedKeys,
    defaultSelectMode = false,
    alwaysSelectMode = false,
    // Default true — require a real, correctly-versioned agent to be
    // included in "เลือกทั้งหมด" (excludes never-provisioned signs, which
    // can never receive a dispatch no matter how long you wait). Online vs
    // offline is NOT filtered here — LiveMonitor's bucket chips split that
    // downstream, once, visibly, instead of the tree silently
    // double-filtering it.
    requireValidAgentOnSelectAll = true,
    hideSignLeaves = false,
    defaultExpandAll = false,
    onBureauClick,
    onStateClick,
    onRouteClick,
    onSignClick,
    onViewSign,
    showControls = true,
  } = props

  const [openBureaus, setOpenBureaus] = useState<Set<string>>(() => {
    if (!defaultExpandAll) return new Set()
    return getExpandKeys(data).bureauKeys
  })
  const [openStates, setOpenStates] = useState<Set<string>>(() => {
    if (!defaultExpandAll) return new Set()
    return getExpandKeys(data).stateKeys
  })
  const [openRoutes, setOpenRoutes] = useState<Set<string>>(() => {
    if (!defaultExpandAll) return new Set()
    return getExpandKeys(data).routeKeys
  })

  const [selectedSign, setSelectedSign] = useState<number | null>(null)
  const [selectMode, setSelectMode] = useState(alwaysSelectMode || defaultSelectMode)
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(
    () => new Set(defaultCheckedKeys ?? [])
  )

  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onSelectionChange?.(buildSelection(data, checkedKeys))
  }, [checkedKeys]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted.current) return
    onSelectModeChange?.(selectMode)
  }, [selectMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const enterSelectMode = useCallback((selectAll: boolean) => {
    setSelectMode(true)
    if (selectAll) setCheckedKeys(getAllKeys(data, requireValidAgentOnSelectAll))
  }, [data, requireValidAgentOnSelectAll])

  // In alwaysSelectMode we only clear ticks — the checkboxes stay visible so
  // operators can immediately pick a fresh set without re-entering select
  // mode. In legacy toggle-mode we exit select mode (hides checkboxes).
  const exitSelectMode = useCallback(() => {
    if (alwaysSelectMode) {
      setCheckedKeys(new Set())
      return
    }
    setSelectMode(false)
    setCheckedKeys(new Set())
  }, [alwaysSelectMode])

  const toggleCheck = useCallback((key: string, descendantKeys: string[] = []) => {
    setCheckedKeys(prev => {
      const next = new Set(prev)
      const checking = !next.has(key)
      if (checking) {
        next.add(key)
        descendantKeys.forEach(k => next.add(k))
      } else {
        next.delete(key)
        descendantKeys.forEach(k => next.delete(k))
      }
      return next
    })
  }, [])

  // ---------------------------------------------------------------------------

  const renderSignItem = useCallback((signs: BureauSign[], parentBureau: BureauItem, parentState: BureauState, parentRoute: BureauRoute) => {
    if (!signs || signs.length === 0) return null

    return signs.map((sign) => {
      const key = signKey(parentBureau, parentState, parentRoute, sign)
      const isSelected = selectedSign === sign.solution_id
      return (
        <div
          key={key}
          onClick={() => {
            if (selectMode) return
            setSelectedSign(prev => prev === sign.solution_id ? null : sign.solution_id)
            onSignClick?.(sign, parentRoute, parentState, parentBureau)
          }}
          className={`p-3 bg-(--mid-gray) rounded-md mb-3 cursor-pointer hover:bg-(--mid-gray)/80 transition-colors border ${isSelected ? 'border-(--yellow)' : 'border-transparent'}`}
        >
          <div className='flex gap-3 items-center'>
            {selectMode && (
              <ConfigProvider
                theme={{
                  token: {
                    colorBgContainer: 'transparent',
                    colorBorder: 'white',
                    colorPrimary: 'white',
                    colorText: 'black',
                    colorWhite: 'black'
                  }
                }}
              >
                <Checkbox
                  checked={checkedKeys.has(key)}
                  onClick={e => e.stopPropagation()}
                  onChange={() => toggleCheck(key)}
                />
              </ConfigProvider>
            )}
            <div className='shrink-0 w-28'>
              <HLSLivePlayer
                hlsUrl={sign.desktop_screen}
                figureClassName='rounded-md w-full aspect-video'
                showLiveBadge={false}
                enableViewportPause={true}
                cameraId={String(sign.solution_id)}
              />
            </div>
            <div className='flex-1 min-w-0'>
              <Tooltip title={sign.solution_name}>
                <h5 className='truncate'>{sign.solution_name}</h5>
              </Tooltip>
              <div className='flex items-center gap-2'>
                <p className='fs-12'>Anydesk: {sign.anydesk || '-'}</p>
                <ConfigProvider
                  theme={{
                    components: {
                      Badge: {
                        dotSize: 12,
                        statusSize: 12,
                        textFontSize: 12,
                        indicatorHeight: 12
                      }
                    }
                  }}
                >
                  <Badge color={sign.is_online ? "var(--default-blue)" : "red"} />
                </ConfigProvider>
                {onViewSign && (
                  <Tooltip title="ดูรายละเอียด">
                    <Button
                      type="text"
                      size="small"
                      icon={<TbEye style={{ verticalAlign: -2 }} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewSign(sign)
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    })
  }, [selectedSign, selectMode, checkedKeys, toggleCheck, onSignClick, onViewSign])

  const renderRouteItem = useCallback((routes: BureauRoute[], parentBureau: BureauItem, parentState: BureauState) => {
    if (!routes || routes.length === 0) return null

    return routes.map((route) => {
      const key = routeKey(parentBureau, parentState, route)
      const isOpen = openRoutes.has(key)
      const online = routeOnline(route)
      const offline = routeOffline(route)
      return (
        <React.Fragment key={key}>
          <div
            onClick={() => { toggleSet(setOpenRoutes, key); onRouteClick?.(route, parentState, parentBureau) }}
            className={`pl-9 pr-3 py-3 bg-(--mid-gray) rounded-md mb-3 cursor-pointer hover:bg-(--mid-gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2 min-w-0 flex-1'>
                {selectMode && (
                  <ConfigProvider
                    theme={{
                      token: {
                        colorBgContainer: 'transparent',
                        colorBorder: 'white',
                        colorPrimary: 'white',
                        colorText: 'black',
                        colorWhite: 'black'
                      }
                    }}
                  >
                    <Checkbox
                      checked={checkedKeys.has(key)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleCheck(key, getRouteDescendantKeys(parentBureau, parentState, route))}
                    />
                  </ConfigProvider>
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18 shrink-0' />
                  : <TbChevronRight className='text-(--yellow) fs-18 shrink-0' />
                }
                <Tooltip title={route.road_name ? `${route.road_code} — ${route.road_name}` : route.road_code}>
                  <h5 className='font-normal! text-(--yellow) truncate'>{route.road_code || route.road_name}</h5>
                </Tooltip>
              </div>
              <div className='flex items-center gap-3 shrink-0'>
                {online > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='var(--default-blue)' text={online} />
                    </ConfigProvider>
                  </span>
                )}
                {offline > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='red' text={offline} />
                    </ConfigProvider>
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderSignItem(route.solution || [], parentBureau, parentState, route)}
        </React.Fragment>
      )
    })
  }, [openRoutes, renderSignItem, selectMode, checkedKeys, toggleCheck, onRouteClick])

  const renderStateItem = useCallback((states: BureauState[], parentBureau: BureauItem) => {
    if (!states || states.length === 0) return null

    return states.map((state) => {
      const key = stateKey(parentBureau, state)
      const isOpen = openStates.has(key)
      return (
        <React.Fragment key={key}>
          <div
            onClick={() => { toggleSet(setOpenStates, key); onStateClick?.(state, parentBureau) }}
            className={`pl-6 pr-3 py-3 bg-(--gray) rounded-md mb-3 cursor-pointer hover:bg-(--gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2 min-w-0 flex-1'>
                {selectMode && (
                  <ConfigProvider
                    theme={{
                      token: {
                        colorBgContainer: 'transparent',
                        colorBorder: 'white',
                        colorPrimary: 'white',
                        colorText: 'black',
                        colorWhite: 'black'
                      }
                    }}
                  >
                    <Checkbox
                      checked={checkedKeys.has(key)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleCheck(key, getStateDescendantKeys(parentBureau, state))}
                    />
                  </ConfigProvider>
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18 shrink-0' />
                  : <TbChevronRight className='text-(--yellow) fs-18 shrink-0' />
                }
                <Tooltip title={state.department_short_name}>
                  <h5 className='font-normal! text-(--yellow) truncate'>{state.department_short_name}</h5>
                </Tooltip>
              </div>
              <div className='flex items-center gap-3 shrink-0'>
                {state.camera_online_count > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='var(--default-blue)' text={state.camera_online_count} />
                    </ConfigProvider>
                  </span>
                )}
                {state.camera_offline_count > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='red' text={state.camera_offline_count} />
                    </ConfigProvider>
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderRouteItem(state.roads || [], parentBureau, state)}
        </React.Fragment>
      )
    })
  }, [openStates, renderRouteItem, selectMode, checkedKeys, toggleCheck, onStateClick])

  const renderBureauItem = useMemo(() => {
    return data.map((item) => {
      const key = bureauKey(item)
      const isOpen = openBureaus.has(key)
      return (
        <React.Fragment key={key}>
          <div
            onClick={() => { toggleSet(setOpenBureaus, key); onBureauClick?.(item) }}
            className={`p-3 bg-(--light-gray) rounded-md mb-3 cursor-pointer hover:bg-(--light-gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2 min-w-0 flex-1'>
                {selectMode && (
                  <ConfigProvider
                    theme={{
                      token: {
                        colorBgContainer: 'transparent',
                        colorBorder: 'white',
                        colorPrimary: 'white',
                        colorText: 'black',
                        colorWhite: 'black'
                      }
                    }}
                  >
                    <Checkbox
                      checked={checkedKeys.has(key)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleCheck(key, getBureauDescendantKeys(item))}
                    />
                  </ConfigProvider>
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18 shrink-0' />
                  : <TbChevronRight className='text-(--yellow) fs-18 shrink-0' />
                }
                <Tooltip title={item.department_short_name}>
                  <h5 className='font-normal! text-(--yellow) truncate'>{item.department_short_name}</h5>
                </Tooltip>
              </div>
              <div className='flex items-center gap-3 shrink-0'>
                {item.camera_online_count > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='var(--default-blue)' text={item.camera_online_count} />
                    </ConfigProvider>
                  </span>
                )}
                {item.camera_offline_count > 0 && (
                  <span className='fs-12 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <ConfigProvider
                      theme={{
                        components: {
                          Badge: {
                            dotSize: 12,
                            statusSize: 12,
                            textFontSize: 12,
                            indicatorHeight: 12
                          }
                        }
                      }}
                    >
                      <Badge color='red' text={item.camera_offline_count} />
                    </ConfigProvider>
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderStateItem(item.sub_department || [], item)}
        </React.Fragment>
      )
    })
  }, [data, openBureaus, renderStateItem, selectMode, checkedKeys, toggleCheck, onBureauClick])

  // ---------------------------------------------------------------------------

  return (
    <div>
      {showControls && (
        <section>
          <div className='flex flex-wrap justify-between items-center gap-3'>
            {alwaysSelectMode ? (
              <>
                <p
                  className='cursor-pointer hover:text-(--yellow) transition-colors'
                  onClick={() => enterSelectMode(true)}
                  title={
                    requireValidAgentOnSelectAll
                      ? 'เลือกทุกป้ายที่มี agent ติดตั้งแล้ว (รวมป้ายออฟไลน์ — ป้ายที่ไม่เคย provision ต้องติ๊กเอง)'
                      : 'เลือกทุกป้ายจริงๆ ไม่กรองอะไรเลย'
                  }
                >
                  เลือกทั้งหมด
                </p>
                <p
                  className='cursor-pointer hover:text-(--yellow) transition-colors'
                  onClick={exitSelectMode}
                >
                  ล้างที่เลือก
                </p>
              </>
            ) : (
              <>
                <p
                  className='cursor-pointer hover:text-(--yellow) transition-colors'
                  onClick={() => selectMode ? exitSelectMode() : enterSelectMode(false)}
                >
                  {selectMode ? 'ยกเลิก' : 'เลือก'}
                </p>
                <p
                  className='cursor-pointer hover:text-(--yellow) transition-colors'
                  onClick={() => selectMode ? exitSelectMode() : enterSelectMode(true)}
                >
                  {selectMode ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </p>
              </>
            )}
          </div>
        </section>
      )}
      <section className='mt-5'>
        {renderBureauItem}
      </section>
    </div>
  )
}

export default React.memo<BureauListProps>(BureauList)
