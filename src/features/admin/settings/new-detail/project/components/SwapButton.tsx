"use client"
import { APIResponseRoadSolution, RoadSolutionList } from '@/types/manage/project-detail-api';
import { Button, ConfigProvider } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  options: APIResponseRoadSolution;
  setLabelValue: (value: string) => void;
  onChange?: (item: RoadSolutionList) => void;
  defaultActive?: string;
  activeValue?: string;
  size?: 'small' | 'middle' | 'large';
  mobileWrap?: boolean;
}

const SwapButton: React.FC<Props> = (props) => {
  const { options, setLabelValue, onChange, defaultActive, activeValue, size = 'large' } = props
  const [internalActive, setInternalActive] = useState(defaultActive)
  // Controlled value wins; otherwise fall back to internal state. The
  // controlled prop is the source of truth — internal state still tracks click
  // events for the uncontrolled case.
  const active = activeValue ?? internalActive

  // The first/default tab is only ever set via `activeValue`/`defaultActive`,
  // never through a click, so it would otherwise never reach `onChange`.
  // Announce it once on mount — an effect runs after commit, so updating an
  // ancestor (e.g. context) from here is safe, unlike doing so directly
  // during render.
  useEffect(() => {
    if (!active) return
    const activeItem = options.find((item) => String(item.project_road_id) === active)
    if (activeItem) onChange?.(activeItem)
    // Mount-only: announces the initial default, not every active change
    // (clicks already call onChange directly in the handler below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderButton = useMemo(() => {
    return options.map((item, index) => {
      const value = String(item.project_road_id)
      const label = item.road?.road_code || item.road?.road_name || `#${item.road_id}`
      const isActive = active === value
      // AntD's default ghost hover clears the border, causing the tab outline
      // to flicker. Pin the blue border + text on hover with `!` so the
      // pill outline stays put; tint the background with #66AEFF1A for feedback.
      const inactiveHover =
        'hover:border-(--default-blue)! hover:text-(--default-blue)! hover:bg-[#66AEFF1A]!'
      return (
        <Button
          // Defensive fallback: if `project_road_id` is ever falsy
          // (undefined/0) or repeated across rows, key on road_id+index
          // instead so React never sees a missing/duplicate key.
          key={item.project_road_id || `road-${item.road_id}-${index}`}
          shape='round'
          size={size}
          ghost={!isActive}
          type={isActive ? 'primary' : 'default'}
          className={`border-0! shadow-md! shadow-blue-500/50! min-w-40 shrink-0 ${isActive ? 'shadow-none!' : inactiveHover}`}
          onClick={() => {
            setInternalActive(value)
            setLabelValue(value)
            onChange?.(item)
          }}
        >
          <p className='fs-12 whitespace-nowrap'>{label}</p>
        </Button>
      )
    })
  }, [options, setLabelValue, onChange, active, size])

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
      <div className='flex items-center gap-2 py-1.5 sm:gap-3 w-full flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' style={{ WebkitOverflowScrolling: 'touch' }}>
        {renderButton}
      </div>
    </ConfigProvider>
  )
}

export default React.memo<Props>(SwapButton)
