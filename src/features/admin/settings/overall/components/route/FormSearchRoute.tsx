"use client"
// Filter bar for the Settings → Route tab.
//
// ALL THREE inputs flow to the backend (verified 2026-08-13):
//   • search  — debounced 500 ms → `?search=`
//   • จังหวัด  — `?province=` (options = full 77-province list from
//     /manage/th_places/provinces, no longer derived from the current page)
//   • ผู้รับผิดชอบ — `?department_id=` (exact; this exact param name only)
// RouteSection resets to page 1 on any change and re-runs /manage/roads, so
// the table + pager always reflect the filtered dataset — the old client-side
// narrowing showed "No data" whenever the current page happened to contain no
// matching rows.
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
