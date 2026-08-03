"use client"
import { Input } from 'antd'
import React, { useCallback, useEffect, useRef } from 'react'
import { TbSearch } from 'react-icons/tb'
import type { ContractorFilters } from '../../types/contractor'

const DEBOUNCE_MS = 500

interface Props {
  filters: ContractorFilters
  onFiltersChange: (patch: Partial<ContractorFilters>) => void
}

/** Real /manage/contractor API has no province field — the province filter
 *  that lived here in the mock UI was removed. Only a debounced text search
 *  remains; the query is forwarded to the server via `?search=` and the
 *  server matches it across the relevant text fields (verified live for
 *  /manage/contractor). Debounce keeps typing from spamming the backend. */
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
    <div>
      <label className='block fs-12 text-white/70 mb-1'>ค้นหา</label>
      <Input
        size='large'
        className='rounded-lg'
        placeholder='ค้นหาชื่อบริษัท / ชื่อย่อ / ผู้ติดต่อ / เบอร์โทร...'
        suffix={<TbSearch className='text-(--yellow)' />}
        defaultValue={filters.search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  )
}

export default React.memo<Props>(FormSearchContact)
