"use client"
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import { MOCK_PROVINCES } from '../../data/mockContractors'
import type { ContractorFilters } from '../../types/contractor'

const DEBOUNCE_MS = 500

interface Props {
  filters: ContractorFilters
  onFiltersChange: (patch: Partial<ContractorFilters>) => void
}

const FormSearchContact: React.FC<Props> = ({ filters, onFiltersChange }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const onSearchChange = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onFiltersChange({ search: value }), DEBOUNCE_MS)
    },
    [onFiltersChange],
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div>
        <label className='block text-xs text-white/70 mb-1'>จังหวัด</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='จังหวัดทั้งหมด...'
          value={filters.province ?? undefined}
          options={MOCK_PROVINCES.map((p) => ({ label: p, value: p }))}
          onChange={(v) => onFiltersChange({ province: v ?? null })}
        />
      </div>
      <div className='md:col-span-2'>
        <label className='block text-xs text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหาชื่อบริษัท / เลขประจำตัวผู้เสียภาษี / ผู้ติดต่อ...'
          suffix={<TbSearch />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchContact)
