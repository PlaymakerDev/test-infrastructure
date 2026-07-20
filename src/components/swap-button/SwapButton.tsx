"use client"
import { Button } from 'antd'
import React, { useMemo, useState } from 'react'

interface Props {
  options: {
    label: string;
    value: string;
  }[];
  setLabelValue: (value: string) => void;
  defaultActive?: string;
  /** Controlled mode — when set, overrides internal state so the parent can
   *  programmatically switch tabs (e.g. a "ดูเพิ่มเติม" button that jumps to
   *  another tab). Omit for the uncontrolled `defaultActive`-only behaviour. */
  activeValue?: string;
  size?: 'small' | 'middle' | 'large';
  /** Wrap onto additional lines instead of horizontally scrolling, at every
   *  viewport width. Default false preserves the original scroll-only
   *  behaviour (only usage is statistics' TitleSection, so this doesn't
   *  affect any other caller). */
  mobileWrap?: boolean;
}

const SwapButton: React.FC<Props> = (props) => {
  const { options, setLabelValue, defaultActive, activeValue, size = 'large', mobileWrap = false } = props
  const [internalActive, setInternalActive] = useState(defaultActive)
  // Controlled value wins; otherwise fall back to internal state. The
  // controlled prop is the source of truth — internal state still tracks click
  // events for the uncontrolled case.
  const active = activeValue ?? internalActive

  const renderButton = useMemo(() => {
    return options.map((item, index) => {
      const isActive = active === item.value
      // AntD's default ghost hover clears the border, causing the tab outline
      // to flicker. Pin the yellow border + text on hover with `!` so the
      // pill outline stays put; tint the background with #FCD1161A for feedback.
      const inactiveHover =
        'hover:border-(--yellow)! hover:text-(--yellow)! hover:bg-[#FCD1161A]!'
      return (
        <Button
          key={index}
          shape='round'
          size={size}
          ghost={!isActive}
          type={isActive ? 'primary' : 'default'}
          className={`border-0! shadow-md! shadow-yellow-500/50! min-w-40 shrink-0 ${isActive ? 'shadow-none!' : inactiveHover}`}
          onClick={() => {
            setInternalActive(item.value)
            setLabelValue(item.value)
          }}
        >
          <p className='fs-12 whitespace-nowrap'>{item.label}</p>
        </Button>
      )
    })
  }, [options, setLabelValue, active, size])

  return (
    <div className='flex items-center gap-2 py-1.5 sm:gap-3 w-full flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' style={{ WebkitOverflowScrolling: 'touch' }}>
      {renderButton}
    </div>
  )
}

export default React.memo<Props>(SwapButton)
