import { Input } from 'antd'
import React from 'react'
import { TbSearch } from 'react-icons/tb'

interface Props {
  onSearch?: (value: string) => void
}

const FormSearchWIM: React.FC<Props> = ({ onSearch }) => (
  <Input
    placeholder="ค้นหาสถานี WIM (Weight-In-Motion)..."
    className='rounded-lg'
    suffix={<TbSearch className='text-(--yellow)' />}
    // size='large'
    allowClear
    onChange={(e) => onSearch?.(e.target.value)}
  />
)

export default React.memo<Props>(FormSearchWIM)
