"use client"
import { Input, Select } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import type { UserFilters, UserRole, UserStatus } from '../../types/user'

const DEBOUNCE_MS = 500

// NOTE: All three inputs feed CLIENT-SIDE filters in UserSection because
// /api-v2/manage/general_user?search=… currently returns malformed JSON
// (task #12) and the endpoint has no server-side role/status filter.
// The search box debounces at 500ms so keystrokes don't thrash the
// downstream memo; role/status dropdowns are cheap and fire immediately.
interface Props {
  filters: UserFilters
  onChange: (patch: Partial<UserFilters>) => void
}

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'ผู้ดูแลระบบ', value: 'admin' },
  { label: 'ผู้ปฏิบัติงาน', value: 'operator' },
  { label: 'ผู้ดูข้อมูล', value: 'viewer' },
]

const STATUS_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: 'ใช้งาน', value: 'active' },
  { label: 'ปิดใช้งาน', value: 'inactive' },
]

const FormSearchUser: React.FC<Props> = ({ filters, onChange }) => {
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
        <label className='block text-xs text-white/70 mb-1'>บทบาท</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='บทบาททั้งหมด...'
          value={filters.role ?? undefined}
          options={ROLE_OPTIONS}
          onChange={(v) => onChange({ role: (v as UserRole) ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>สถานะ</label>
        <Select
          size='large'
          allowClear
          className='w-full'
          placeholder='สถานะทั้งหมด...'
          value={filters.status ?? undefined}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange({ status: (v as UserStatus) ?? null })}
        />
      </div>
      <div>
        <label className='block text-xs text-white/70 mb-1'>&nbsp;</label>
        <Input
          size='large'
          className='rounded-lg'
          placeholder='ค้นหา username / ชื่อ...'
          suffix={<TbSearch className='text-(--yellow)' />}
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchUser)
