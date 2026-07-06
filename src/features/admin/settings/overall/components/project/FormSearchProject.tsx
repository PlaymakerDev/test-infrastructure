"use client"
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import { MOCK_BUDGET_YEARS, MOCK_CONTRACTORS, MOCK_OWNERS } from '../../data/mockProjects'
import { useOverallContext } from '../../context'

const DEBOUNCE_MS = 500

const FormSearchProject: React.FC = () => {
  const { filters, setFilters } = useOverallContext()
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
      timerRef.current = setTimeout(() => setFilters({ search: value }), DEBOUNCE_MS)
    },
    [setFilters],
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ปีงบประมาณ</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='ปีงบประมาณทั้งหมด...'
          value={filters.budgetYear ?? undefined}
          options={MOCK_BUDGET_YEARS.map((y) => ({ label: y.toString(), value: y }))}
          onChange={(v) => setFilters({ budgetYear: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ผู้ว่าจ้าง</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='ผู้ว่าจ้างทั้งหมด...'
          value={filters.owner ?? undefined}
          options={MOCK_OWNERS.map((o) => ({ label: o, value: o }))}
          onChange={(v) => setFilters({ owner: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ผู้รับจ้าง</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='ผู้รับจ้างทั้งหมด...'
          value={filters.contractor ?? undefined}
          options={MOCK_CONTRACTORS.map((c) => ({ label: c, value: c }))}
          onChange={(v) => setFilters({ contractor: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหาชื่อโครงการ...'
          suffix={<TbSearch />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo(FormSearchProject)
