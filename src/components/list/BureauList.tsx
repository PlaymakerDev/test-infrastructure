"use client"
import { Badge, Checkbox, Image } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface BureauSign {
  id: string
  name: string
  anydesk: string
  is_active: boolean
  latitude: number | null
  longitude: number | null
  vms_img: string
}

export interface BureauRoute {
  id: string
  title: string
  total_active: number
  total_inactive: number
  latitude?: number | null
  longitude?: number | null
  sign?: BureauSign[]
}

export interface BureauState {
  id: string
  title: string
  total_active: number
  total_inactive: number
  latitude?: number | null
  longitude?: number | null
  route?: BureauRoute[]
}

export interface BureauItem {
  id: string
  title: string
  total_active: number
  total_inactive: number
  latitude?: number | null
  longitude?: number | null
  state?: BureauState[]
}

// ---------------------------------------------------------------------------
// Selection type — resolved objects for each level
// ---------------------------------------------------------------------------

export interface BureauSelection {
  /** All checked compound keys. */
  keys: string[]
  bureaus: BureauItem[]
  states: BureauState[]
  routes: BureauRoute[]
  signs: BureauSign[]
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BureauListProps {
  data: BureauItem[]

  // --- Selection callbacks ---
  /** Fires whenever the checked set changes. Receives resolved objects per level. */
  onSelectionChange?: (selection: BureauSelection) => void
  /** Fires when select mode is toggled on or off. */
  onSelectModeChange?: (active: boolean) => void

  // --- Selection defaults ---
  /** Pre-checked compound keys on mount. */
  defaultCheckedKeys?: string[]
  /** Start the component already in select mode. */
  defaultSelectMode?: boolean

  // --- Expand / collapse ---
  /** Expand all bureaus, states, and routes on mount. */
  defaultExpandAll?: boolean

  // --- Item click callbacks ---
  /** Called when a bureau row is clicked (expand/collapse toggle). */
  onBureauClick?: (bureau: BureauItem) => void
  /** Called when a state row is clicked (expand/collapse toggle). */
  onStateClick?: (state: BureauState, bureau: BureauItem) => void
  /** Called when a route row is clicked (expand/collapse toggle). */
  onRouteClick?: (route: BureauRoute, state: BureauState, bureau: BureauItem) => void
  /** Called when a sign card is clicked outside of select mode. */
  onSignClick?: (sign: BureauSign) => void

  // --- UI ---
  /** Show the เลือก / เลือกทั้งหมด header row. Defaults to true. */
  showControls?: boolean
}

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
    keys.add(bureau.id)
    for (const state of bureau.state || []) {
      const sk = `${bureau.id}-${state.id}`
      keys.add(sk)
      for (const route of state.route || []) {
        const rk = `${sk}-${route.id}`
        keys.add(rk)
        for (const sign of route.sign || []) {
          keys.add(`${rk}-${sign.id}`)
        }
      }
    }
  }
  return keys
}

const getExpandKeys = (data: BureauItem[]) => {
  const bureauKeys = new Set<string>()
  const stateKeys = new Set<string>()
  const routeKeys = new Set<string>()
  for (const bureau of data) {
    bureauKeys.add(bureau.id)
    for (const state of bureau.state || []) {
      const sk = `${bureau.id}-${state.id}`
      stateKeys.add(sk)
      for (const route of state.route || []) {
        routeKeys.add(`${sk}-${route.id}`)
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
    if (checkedKeys.has(bureau.id)) bureaus.push(bureau)
    for (const state of bureau.state || []) {
      const sk = `${bureau.id}-${state.id}`
      if (checkedKeys.has(sk)) states.push(state)
      for (const route of state.route || []) {
        const rk = `${sk}-${route.id}`
        if (checkedKeys.has(rk)) routes.push(route)
        for (const sign of route.sign || []) {
          if (checkedKeys.has(`${rk}-${sign.id}`)) signs.push(sign)
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

  const [selectedSign, setSelectedSign] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(defaultSelectMode)
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(
    () => new Set(defaultCheckedKeys ?? [])
  )

  // Fire callbacks only after mount
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

  const toggleCheck = useCallback((key: string) => {
    setCheckedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }, [])

  // ---------------------------------------------------------------------------

  const renderSignItem = useCallback((signItem: BureauSign[], parentKey: string) => {
    if (!signItem || signItem.length === 0) return null

    return signItem.map((sign) => {
      const signKey = `${parentKey}-${sign.id}`
      const isSelected = selectedSign === sign.id
      return (
        <div
          key={signKey}
          onClick={() => {
            if (selectMode) return
            setSelectedSign(prev => prev === sign.id ? null : sign.id)
            onSignClick?.(sign)
          }}
          className={`p-3 bg-(--mid-gray) rounded-md mb-3 cursor-pointer hover:bg-(--mid-gray)/80 transition-colors border ${isSelected ? 'border-(--yellow)' : 'border-transparent'}`}
        >
          <div className='flex gap-3 items-center'>
            {selectMode && (
              <Checkbox
                checked={checkedKeys.has(signKey)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggleCheck(signKey)}
              />
            )}
            <div className='shrink-0 w-28'>
              <Image
                src={sign.vms_img} alt={sign.name}
                width="100%"
                height="100%"
                className='rounded-md object-cover object-center'
                preview={false}
              />
            </div>
            <div className='flex-1 min-w-0'>
              <h5>{sign.name}</h5>
              <div className='flex items-center gap-2'>
                <p className='fs-12'>Anydesk: {sign.anydesk || '-'}</p>
                <Badge color={sign.is_active ? 'blue' : 'red'} />
              </div>
            </div>
          </div>
        </div>
      )
    })
  }, [selectedSign, selectMode, checkedKeys, toggleCheck, onSignClick])

  const renderRouteItem = useCallback((routeItem: BureauRoute[], parentKey: string, parentState: BureauState, parentBureau: BureauItem) => {
    if (!routeItem || routeItem.length === 0) return null

    return routeItem.map((route) => {
      const key = `${parentKey}-${route.id}`
      const isOpen = openRoutes.has(key)
      return (
        <React.Fragment key={key}>
          <div
            onClick={() => { toggleSet(setOpenRoutes, key); onRouteClick?.(route, parentState, parentBureau) }}
            className={`pl-9 pr-3 py-3 bg-(--mid-gray) rounded-md mb-3 cursor-pointer hover:bg-(--mid-gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                {selectMode && (
                  <Checkbox
                    checked={checkedKeys.has(key)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleCheck(key)}
                  />
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{route.title}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {route.total_active > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-blue-500 text-blue-500 rounded-3xl'>
                    <Badge color='blue' text={route.total_active} />
                  </span>
                )}
                {route.total_inactive > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <Badge color='red' text={route.total_inactive} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderSignItem(route.sign || [], key)}
        </React.Fragment>
      )
    })
  }, [openRoutes, renderSignItem, selectMode, checkedKeys, toggleCheck, onRouteClick])

  const renderStateItem = useCallback((stateItem: BureauState[], parentKey: string, parentBureau: BureauItem) => {
    if (!stateItem || stateItem.length === 0) return null

    return stateItem.map((state) => {
      const key = `${parentKey}-${state.id}`
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
                  <Checkbox
                    checked={checkedKeys.has(key)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleCheck(key)}
                  />
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{state.title}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {state.total_active > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-blue-500 text-blue-500 rounded-3xl'>
                    <Badge color='blue' text={state.total_active} />
                  </span>
                )}
                {state.total_inactive > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <Badge color='red' text={state.total_inactive} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderRouteItem(state.route || [], key, state, parentBureau)}
        </React.Fragment>
      )
    })
  }, [openStates, renderRouteItem, selectMode, checkedKeys, toggleCheck, onStateClick])

  const renderBureauItem = useMemo(() => {
    return data.map((item) => {
      const isOpen = openBureaus.has(item.id)
      return (
        <React.Fragment key={item.id}>
          <div
            onClick={() => { toggleSet(setOpenBureaus, item.id); onBureauClick?.(item) }}
            className={`p-3 bg-(--light-gray) rounded-md mb-3 cursor-pointer hover:bg-(--light-gray)/80 transition-colors border ${isOpen ? 'border-(--yellow)' : 'border-transparent'}`}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                {selectMode && (
                  <Checkbox
                    checked={checkedKeys.has(item.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleCheck(item.id)}
                  />
                )}
                {isOpen
                  ? <TbChevronDown className='text-(--yellow) fs-18' />
                  : <TbChevronRight className='text-(--yellow) fs-18' />
                }
                <h5 className='font-normal! text-(--yellow)'>{item.title}</h5>
              </div>
              <div className='flex items-center gap-3'>
                {item.total_active > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-blue-500 text-blue-500 rounded-3xl'>
                    <Badge color='blue' text={item.total_active} />
                  </span>
                )}
                {item.total_inactive > 0 && (
                  <span className='fs-11 py-0.5 px-3 border border-red-500 text-red-500 rounded-3xl'>
                    <Badge color='red' text={item.total_inactive} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen && renderStateItem(item.state || [], item.id, item)}
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
