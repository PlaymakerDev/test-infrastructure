"use client"
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import {
  useBudgetYears,
  useDepartments,
  useProjectContractors,
} from '@/hooks/queries/manage'
import { useOverallContext } from '../../context'

const DEBOUNCE_MS = 500

const FormSearchProject: React.FC = () => {
  const { filters, setFilters } = useOverallContext()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: budgetYears, isLoading: byLoading } = useBudgetYears()
  const { data: departments, isLoading: deptLoading } = useDepartments()
  const { data: contractors, isLoading: cLoading } = useProjectContractors()

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

  const yearOptions = useMemo(
    () =>
      (budgetYears ?? []).map((y) => ({
        label: y.toString(),
        value: y,
      })),
    [budgetYears],
  )

  // Filter matches `Project.owner` which is the mapped `department_short_name`,
  // so we key options by the same string label rather than the numeric id.
  const ownerOptions = useMemo(
    () =>
      (departments ?? []).map((d) => ({
        label: d.department_short_name,
        value: d.department_short_name,
      })),
    [departments],
  )

  // Same pattern — filter compares against the mapped `company_name`.
  const contractorOptions = useMemo(
    () =>
      (contractors ?? []).map((c) => ({
        label: c.company_name,
        value: c.company_name,
      })),
    [contractors],
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
          options={yearOptions}
          loading={byLoading}
          onChange={(v) => setFilters({ budgetYear: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ผู้ว่าจ้าง</label>
        <Select
          size='large'
          allowClear
          showSearch
          optionFilterProp='label'
          className='w-full'
          placeholder='ผู้ว่าจ้างทั้งหมด...'
          value={filters.owner ?? undefined}
          options={ownerOptions}
          loading={deptLoading}
          onChange={(v) => setFilters({ owner: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>ผู้รับจ้าง</label>
        <Select
          size='large'
          allowClear
          showSearch
          optionFilterProp='label'
          className='w-full'
          placeholder='ผู้รับจ้างทั้งหมด...'
          value={filters.contractor ?? undefined}
          options={contractorOptions}
          loading={cLoading}
          onChange={(v) => setFilters({ contractor: v ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหาชื่อโครงการ...'
          suffix={<TbSearch className='text-(--yellow)' />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo(FormSearchProject)
