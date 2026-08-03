"use client"
// Filter bar for the Settings → Route tab.
//
// Search flows to the backend: the debounced value (500 ms) is pushed into
// `filters.search`, RouteSection resets to page 1 and re-runs the /manage/roads
// query with `?search=`. Roads is the ONE list endpoint where server search is
// verified working.
//
// Province + responsibleOffice DO NOT have a server-side counterpart on
// /manage/roads, so those two `Select`s narrow the CURRENT PAGE only —
// browsing pages may reveal / hide matches. Kept client-side deliberately;
// widening this to full-dataset filtering would require server support.
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { RouteFilters } from '../../types/route'

const DEBOUNCE_MS = 500

interface Props {
  filters: RouteFilters
  onChange: (patch: Partial<RouteFilters>) => void
  provinceOptions: string[]
  departments: APIResponseDepartment[]
}

const FormSearchRoute: React.FC<Props> = ({
  filters,
  onChange,
  provinceOptions,
  departments,
}) => {
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

  const provinceSelectOptions = useMemo(
    () => provinceOptions.map((p) => ({ label: p, value: p })),
    [provinceOptions],
  )

  const departmentSelectOptions = useMemo(
    () =>
      departments
        .filter((d) => !!d.department_short_name)
        .map((d) => ({ label: d.department_short_name, value: d.id })),
    [departments],
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div>
        <label className='block fs-12 text-white/70 mb-1'>จังหวัด</label>
        <Select
          size='large'
          allowClear
          showSearch
          className='w-full'
          placeholder='จังหวัดทั้งหมด...'
          value={filters.province ?? undefined}
          options={provinceSelectOptions}
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
          onChange={(v) => onChange({ province: v ?? null })}
        />
      </div>
      <div>
        <label className='block fs-12 text-white/70 mb-1'>ผู้รับผิดชอบ</label>
        <Select
          size='large'
          allowClear
          showSearch
          className='w-full'
          placeholder='ผู้รับผิดชอบทั้งหมด...'
          value={filters.departmentId ?? undefined}
          options={departmentSelectOptions}
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
          onChange={(v) => onChange({ departmentId: typeof v === 'number' ? v : null })}
        />
      </div>
      <div>
        <label className='block fs-12 text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหารหัสหรือชื่อสายทาง...'
          suffix={<TbSearch className='text-(--yellow)' />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchRoute)
