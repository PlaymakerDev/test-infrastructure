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
  size?: 'small' | 'middle' | 'large';
}

const SwapButton: React.FC<Props> = (props) => {
  const { options, setLabelValue, defaultActive, size = 'large' } = props
  const [active, setActive] = useState(defaultActive)

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
          setActive(item.value)
          setLabelValue(item.value)
        }}
      >
        <p className='whitespace-nowrap'>{item.label}</p>
      </Button>
    ))
  }, [options, setLabelValue, active])

  return (
    <div className='flex items-center gap-2 sm:gap-3 w-full flex-wrap sm:flex-nowrap sm:overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' style={{ WebkitOverflowScrolling: 'touch' }}>
      {renderButton}
    </div>
  )
}

export default React.memo<Props>(SwapButton)
