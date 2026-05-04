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
}

const SwapButton: React.FC<Props> = (props) => {
  const { options, setLabelValue, defaultActive } = props
  const [active, setActive] = useState(defaultActive)

  const renderButton = useMemo(() => {
    return options.map((item, index) => (
      <Button
        key={index}
        shape='round'
        size='large'
        ghost={active === item.value ? false : true}
        type={active === item.value ? 'primary' : 'default'}
        onClick={() => {
          setActive(item.value)
          setLabelValue(item.value)
        }}
      >
        {item.label}
      </Button>
    ))
  }, [options, setLabelValue, active])

  return (
    <div className='flex items-center gap-3 w-full overflow-x-auto'>
      {renderButton}
    </div>
  )
}

export default React.memo<Props>(SwapButton)
