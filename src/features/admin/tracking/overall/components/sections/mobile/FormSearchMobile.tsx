import { Input } from 'antd';
import React from 'react'
import { TbSearch } from 'react-icons/tb';

interface Props {
  onSearch?: (value: string) => void
}

const FormSearchMobile: React.FC<Props> = ({ onSearch }) => (
  <Input
    placeholder="ค้นหาจุดตั้งด่าน..."
    className='rounded-lg'
    suffix={<TbSearch />}
    // size='large'
    allowClear
    onChange={(e) => onSearch?.(e.target.value)}
  />
)

export default React.memo<Props>(FormSearchMobile)