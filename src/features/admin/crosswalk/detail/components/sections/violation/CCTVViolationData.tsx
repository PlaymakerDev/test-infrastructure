"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Empty, Image } from 'antd'
import { useCrosswalkViolationListInfinite } from '@/hooks/queries/crosswalk'
import { useDetailContext } from '../../../context'
import { type ViolationFilter } from './filter'
import BluePagination from './BluePagination'

interface Props {
  filter: ViolationFilter
}

/** Fixed 10 cards per page — matches TableViolationData for a consistent
 *  page-count between the two views (users switching TABLE ↔ GRID stay on
 *  the same "record range"). */
const PAGE_SIZE = 10
const BACKEND_PAGE_SIZE = 10
const MAX_AUTO_PAGES = 100

/** Split pedestrian vs vehicle events by Thai label prefix. Mirrors
 *  TableViolationData's `eventClass` so both views tint alike. */
const violationColor = (nameTh: string): string =>
  nameTh.trim().startsWith('รถ') ? '#FF7B00' : '#EF4444'

const CCTVViolationData: React.FC<Props> = ({ filter }) => {
  const { id } = useDetailContext()
  const [page, setPage] = useState(1)

  // Reset to page 1 whenever the filter changes — same "setState during
  // render on prop change" pattern used in TableViolationData.
  const filterSig = `${filter.startDate}|${filter.endDate}|${filter.status}`
  const [prevSig, setPrevSig] = useState(filterSig)
  if (prevSig !== filterSig) {
    setPrevSig(filterSig)
    setPage(1)
  }

  // Same infinite hook the table uses — pages are cached under a shared
  // query key so switching TABLE ↔ GRID doesn't re-fetch.
  const infiniteQuery = useCrosswalkViolationListInfinite({
    solution_id: id,
    start_date: filter.startDate || undefined,
    end_date: filter.endDate || undefined,
    limit: BACKEND_PAGE_SIZE,
  })

  const fetchNextPage = infiniteQuery.fetchNextPage
  const hasNextPage = infiniteQuery.hasNextPage
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage
  const pagesFetched = infiniteQuery.data?.pages.length ?? 0
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    if (pagesFetched >= MAX_AUTO_PAGES) return
    fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, pagesFetched])

  const isLoading = infiniteQuery.isLoading || isFetchingNextPage

  const allRawRows = useMemo(
    () => infiniteQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [infiniteQuery.data],
  )

  const filteredRows = useMemo(() => {
    if (filter.status === 'ALL') return allRawRows
    return allRawRows.filter((r) => {
      const isVehicle = r.crosswalk.name_th.trim().startsWith('รถ')
      return filter.status === 'VEHICLE_VIOLATION' ? isVehicle : !isVehicle
    })
  }, [allRawRows, filter.status])

  const pageStart = (page - 1) * PAGE_SIZE
  const pageRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const showPagination = totalPages > 1

  // 5-column grid at xl+ — AntD's 24-column system can't split evenly into
  // 5, so use CSS grid (Tailwind) instead. Responsive breakpoints roughly
  // match the old AntD ones: 1 → 2 → 3 → 5 columns as viewport widens.
  const GRID_CLASSES =
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'

  if (isLoading && pageRows.length === 0) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='bg-(--gray) rounded-lg animate-pulse aspect-4/3'
          />
        ))}
      </div>
    )
  }

  if (pageRows.length === 0) {
    return (
      <div className='py-10'>
        <Empty description='ไม่พบข้อมูลการฝ่าฝืน' />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className={GRID_CLASSES}>
        {pageRows.map((r, i) => {
          const color = violationColor(r.crosswalk.name_th)
          // Backend timestamp already Thai-formatted, e.g. "22/06/2569 16:24".
          return (
            <div
              key={`${pageStart + i}-${r.camera.id}-${r.crosswalk.timestamp}`}
              className='p-5 bg-(--gray) rounded-lg h-full flex flex-col'
            >
              <div className='mb-2'>
                <h4 style={{ color }}>{r.crosswalk.name_th}</h4>
                <p className='fs-12 text-gray-400 mb-0'>
                  {r.crosswalk.timestamp} น.
                </p>
              </div>
              <figure className='flex-1 min-h-0 rounded-lg overflow-hidden mb-1.5 bg-black/40'>
                {r.image_path ? (
                  <Image
                    src={r.image_path}
                    alt='event'
                    className='w-full h-full object-cover'
                    preview={{ mask: 'ดูภาพ' }}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-white/40 fs-12'>
                    ไม่มีภาพเหตุการณ์
                  </div>
                )}
              </figure>
              <div>
                <h4 className='text-blue-500'>{r.camera.name}</h4>
                <p className='fs-12 text-gray-400 mb-0'>
                  IP Address : {r.camera.sta || '-'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {showPagination && (
        <BluePagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  )
}

export default React.memo<Props>(CCTVViolationData)
