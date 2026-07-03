"use client"
import React, { useMemo, useState, useCallback } from 'react'
import {
  FormSearchViolation,
  ViolationStatCard,
  TableViolationData,
  CCTVViolationData,
} from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'
import { defaultViolationFilter, type ViolationFilter } from './sections/violation/filter'

interface Props { }

const ViolationSection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [filter, setFilter] = useState<ViolationFilter>(() => defaultViolationFilter())

  const handleFilterChange = useCallback(
    (patch: Partial<ViolationFilter>) => {
      setFilter((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableViolationData filter={filter} />
      case 'GRID':
        return <CCTVViolationData filter={filter} />
      default:
        return null
    }
  }, [displayType, filter])

  return (
    <div>
      <section>
        <FormSearchViolation value={filter} onChange={handleFilterChange} />
      </section>
      <section className='mt-5'>
        <ViolationStatCard filter={filter} />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม'
          onViewModeChange={setDisplayType}
        />
      </section>
      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
