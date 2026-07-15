"use client"
import { Empty, Input, Spin } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TbSearch } from 'react-icons/tb'
import LicenseList, { type LicenseItem } from '@/components/list/LicenseList'
import QueryBoundary from '@/components/common/QueryBoundary'
import { usePlatesInfinite } from '@/hooks/queries/lpr'
import type { LPRPlateListItem } from '@/types/lpr/lpr-api'
import { VEHICLE_TYPE_COLOR } from '@/constants/vehicle'
import { useOverallContext } from '../../../context'

interface Props {
  openFromDrawer?: boolean
}

// Left-card badge (Decision #1): WIM shows the vehicle type label, ANPR the
// type name. `vehicle_type_number` already arrives as a preformatted string
// ("ประเภท 1") — render it as-is, do NOT prefix "ประเภท" again.
const badgeLabel = (item: LPRPlateListItem): string => {
  const typeNo = item.vehicle_type_number
  if (item.source === 'wim' && typeNo != null && `${typeNo}`.trim() !== '') {
    return `${typeNo}`
  }
  return item.vehicle_type_name ?? '-'
}

const toLicenseItem = (p: LPRPlateListItem): LicenseItem => ({
  id: `${p.plate_province}|${p.plate_number}`,
  license_no: p.plate_number,
  license_province: p.plate_province,
  license_type: badgeLabel(p),
  // Color by the actual type name; WIM ("ประเภท N") has no name match → default.
  license_type_color: p.vehicle_type_name ? VEHICLE_TYPE_COLOR[p.vehicle_type_name] : undefined,
  road_description: p.detection_point ?? 'ไม่ระบุจุดตรวจจับ',
  sta: '',
  timestamp: p.captured_at_display,
})

const SearchSection: React.FC<Props> = (props) => {
  const { openFromDrawer } = props
  const { selected, setSelected } = useOverallContext()

  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(value.trim()), 400)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePlatesInfinite({ q })

  const items = useMemo(
    // res_data can come back null (not []) when a search has no matches — guard it.
    () => (data?.pages ?? []).flatMap((page) => page.res_data ?? []).map(toLicenseItem),
    [data]
  )

  // Default selection: when nothing is picked yet, auto-select the latest plate
  // (the list is sorted captured_at DESC, so items[0] is the newest). Does not
  // override an explicit user selection.
  useEffect(() => {
    if (!selected && items.length > 0) {
      setSelected({
        plate_number: items[0].license_no,
        plate_province: items[0].license_province,
      })
    }
  }, [selected, items, setSelected])

  const selectedId = selected
    ? `${selected.plate_province}|${selected.plate_number}`
    : null

  // Infinite scroll — load the next cursor page as the sentinel enters view.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSelect = useCallback(
    (item: LicenseItem) => {
      setSelected({
        plate_number: item.license_no,
        plate_province: item.license_province,
      })
    },
    [setSelected]
  )

  return (
    <div
      className={`bg-(--dark-black) rounded-tr-lg ${openFromDrawer ? 'p-5' : 'py-10 px-12'} h-full`}
    >
      <section>
        <Input
          value={search}
          onChange={onSearchChange}
          placeholder="ค้นหาป้ายทะเบียน..."
          className='rounded-lg'
          suffix={<TbSearch className='text-(--yellow)' />}
          size='large'
          allowClear
        />
      </section>
      <section className='mt-5'>
        <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={8}>
          {items.length === 0 ? (
            <Empty description='ไม่พบป้ายทะเบียน' />
          ) : (
            <>
              <LicenseList data={items} onSelect={handleSelect} selectedId={selectedId} />
              <div ref={sentinelRef} className='h-px' />
              {isFetchingNextPage && (
                <div className='flex justify-center py-4'>
                  <Spin size='small' />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </section>
    </div>
  )
}

export default React.memo<Props>(SearchSection)
