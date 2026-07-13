"use client"
import { Badge, Checkbox, ConfigProvider } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
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

const getAllKeys = (data: BureauItem[]): Set<string> => {
  const keys = new Set<string>()
  for (const bureau of data) {
    keys.add(bureauKey(bureau))
    for (const state of bureau.sub_department || []) {
      const sk = stateKey(bureau, state)
      keys.add(sk)
      for (const route of state.roads || []) {
        const rk = routeKey(bureau, state, route)
        keys.add(rk)
        for (const sign of route.solution || []) {
          keys.add(signKey(bureau, state, route, sign))
        }
      }
    }
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
    defaultExpandAll = false,
    onBureauClick,
    onStateClick,
    onRouteClick,
    onSignClick,
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
  const [selectMode, setSelectMode] = useState(defaultSelectMode)
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
    if (selectAll) setCheckedKeys(getAllKeys(data))
  }, [data])

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setCheckedKeys(new Set())
  }, [])

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
              <h5>{sign.solution_name}</h5>
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
              </div>
            </div>
          </div>
        </div>
      )
    })
  }, [selectedSign, selectMode, checkedKeys, toggleCheck, onSignClick])

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
              <div className='flex items-center gap-2'>
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
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{route.road_name || route.road_code}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {online > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
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
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
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
              <div className='flex items-center gap-2'>
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
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{state.department_short_name}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {state.camera_online_count > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
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
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
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
              <div className='flex items-center gap-2'>
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
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{item.department_short_name}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {item.camera_online_count > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-(--default-blue) text-(--default-blue) rounded-3xl'>
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
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
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
