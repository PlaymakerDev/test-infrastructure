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
}

const SwapButton: React.FC<Props> = (props) => {
  const { options, setLabelValue, defaultActive, activeValue, size = 'large' } = props
  const [internalActive, setInternalActive] = useState(defaultActive)
  // Controlled value wins; otherwise fall back to internal state. The
  // controlled prop is the source of truth — internal state still tracks click
  // events for the uncontrolled case.
  const active = activeValue ?? internalActive

  const renderButton = useMemo(() => {
    return options.map((item, index) => (
      <Button
        key={index}
        shape='round'
        size={size}
        ghost={active === item.value ? false : true}
        type={active === item.value ? 'primary' : 'default'}
        className='shrink-0'
        onClick={() => {
          setInternalActive(item.value)
          setLabelValue(item.value)
        }}
      >
        <p className='whitespace-nowrap'>{item.label}</p>
      </Button>
    ))
  }, [options, setLabelValue, active, size])

  return (
    <div className='flex items-center gap-2 sm:gap-3 w-full flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' style={{ WebkitOverflowScrolling: 'touch' }}>
      {renderButton}
    </div>
  )
}

export default React.memo<Props>(SwapButton)
