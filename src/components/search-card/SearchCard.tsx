"use client"
import { Input } from 'antd'
import React, { useState, useCallback } from 'react'
import { TbSearch } from 'react-icons/tb'

interface Props {
  /** Placeholder text for the search input */
  placeholder?: string
  /** Callback when user submits search */
  onSearch?: (value: string) => void
  /** Content below the search input */
  children?: React.ReactNode
  /** Additional className */
  className?: string
  /** Additional inline styles */
  style?: React.CSSProperties
}

const SearchCard: React.FC<Props> = ({
  placeholder = 'ค้นหาสายทาง...',
  onSearch,
  children,
  className,
  style,
}) => {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const handlePressEnter = useCallback(() => {
    onSearch?.(value)
  }, [onSearch, value])

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#191919',
        borderRadius: 20,
        padding: 20,
        ...style,
      }}
    >
      <style>{`
        .search-card-input::placeholder {
          color: #FCD116 !important;
          font-weight: 400;
          font-size: 14px;
        }
      `}</style>
      <Input
        value={value}
        onChange={handleChange}
        onPressEnter={handlePressEnter}
        placeholder={placeholder}
        className='rounded-lg'
        classNames={{
          input: 'search-card-input',
        }}
        styles={{
          input: {
            fontSize: 14,
            fontWeight: 400,
            color: '#FFFFFF',
          },
        }}
        prefix={<TbSearch style={{ color: '#FCD116' }} />}
        size='large'
        allowClear
      />
      {children}
    </div>
  )
}

export default React.memo<Props>(SearchCard)
