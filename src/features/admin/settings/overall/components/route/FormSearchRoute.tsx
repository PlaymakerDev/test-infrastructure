"use client"
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import { MOCK_ROUTE_OFFICES, MOCK_ROUTE_PROVINCES } from '../../data/mockRoutes'
import type { RouteFilters } from '../../types/route'

const DEBOUNCE_MS = 500

interface Props {
  filters: RouteFilters
  onChange: (patch: Partial<RouteFilters>) => void
}

const FormSearchRoute: React.FC<Props> = ({ filters, onChange }) => {
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
      timerRef.current = setTimeout(() => onChange({ search: value }), DEBOUNCE_MS)
    },
    [onChange],
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
          options={MOCK_ROUTE_PROVINCES.map((p) => ({ label: p, value: p }))}
          onChange={(v) => onChange({ province: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ผู้รับผิดชอบ</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='ผู้รับผิดชอบทั้งหมด...'
          value={filters.responsibleOffice ?? undefined}
          options={MOCK_ROUTE_OFFICES.map((o) => ({ label: o, value: o }))}
          onChange={(v) => onChange({ responsibleOffice: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหารหัสหรือชื่อสายทาง...'
          suffix={<TbSearch />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchRoute)
