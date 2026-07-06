"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueries } from '@tanstack/react-query'
import { useCrosswalkViolationListInfinite } from '@/hooks/queries/crosswalk'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'
import { useDetailContext } from '../../../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'
import { type ViolationFilter } from './filter'
import BluePagination from './BluePagination'

interface Props {
  filter: ViolationFilter
}

interface Row extends CrosswalkViolationRow {
  seq: number
}

/** Fixed page size for the UI table — matches the traffic-volume report
 *  tab. Client-side pagination against the concatenated infinite-query
 *  pages. */
const PAGE_SIZE = 10

/** Backend page size we request per fetch. Kept small (matches the endpoint
 *  default) because larger values (e.g. 500 / 9999) were observed to make
 *  the backend return an empty `res_data`. The infinite query walks pages
 *  until the whole date range is loaded. */
const BACKEND_PAGE_SIZE = 10

/** Safety cap on auto-walked pages — 100 backend pages × 10 rows/page =
 *  1000 events. Well above a single day for any real crosswalk, but bounded
 *  in case a wide user-selected range would otherwise fire hundreds of
 *  sequential requests. */
const MAX_AUTO_PAGES = 100

/** Split pedestrian vs vehicle events by the Thai label prefix — the backend's
 *  English slugs ("unbuttoned-crossing", "red-light-…") don't consistently
 *  carry a person/vehicle keyword, but the Thai label always starts with
 *  "คน" (person) or "รถ" (vehicle). */
const eventClass = (nameTh: string): string => {
  if (nameTh.trim().startsWith('รถ')) {
    return 'border-[#FF7B00] text-[#FF7B00]'
  }
  return 'border-red-500 text-red-500'
}

const TableViolationData: React.FC<Props> = ({ filter }) => {
  const { id } = useDetailContext()
  const [page, setPage] = useState(1)

  // Reset pagination to page 1 whenever the filter changes — otherwise the
  // user can land on an empty page 5 after narrowing the date range. Uses
  // the "setState during render on prop change" pattern (React docs) so we
  // don't cascade an extra render — mirrors the report tab's `resetKey`
  // reset in traffic-volume.
  const filterSig = `${filter.startDate}|${filter.endDate}|${filter.status}`
  const [prevSig, setPrevSig] = useState(filterSig)
  if (prevSig !== filterSig) {
    setPrevSig(filterSig)
    setPage(1)
  }

  // Infinite fetch — walks the backend's paged response until the whole date
  // range is loaded, then we filter + paginate client-side. Necessary because
  // (a) backend rejects large `limit` values so a one-shot fetch truncates,
  // and (b) status filtering runs client-side (backend's `crossing_type`
  // value mapping isn't documented).
  const infiniteQuery = useCrosswalkViolationListInfinite({
    solution_id: id,
    start_date: filter.startDate || undefined,
    end_date: filter.endDate || undefined,
    limit: BACKEND_PAGE_SIZE,
  })

  // Auto-walk every page once enabled — the user shouldn't have to click
  // "load more". Capped at MAX_AUTO_PAGES so a wide-open date range can't
  // spawn hundreds of sequential requests. Depends only on the primitive
  // fields (not the query object) so deps stay stable across renders.
  const fetchNextPage = infiniteQuery.fetchNextPage
  const hasNextPage = infiniteQuery.hasNextPage
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage
  const pagesFetched = infiniteQuery.data?.pages.length ?? 0
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    if (pagesFetched >= MAX_AUTO_PAGES) return
    fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, pagesFetched])

  const isLoading = infiniteQuery.isLoading || infiniteQuery.isFetchingNextPage

  // Flatten every fetched page into a single array — this is the full
  // dataset for the current date range.
  const allRawRows = useMemo<CrosswalkViolationRow[]>(
    () => infiniteQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [infiniteQuery.data],
  )

  // Client-side status filter — matches on `name_th` prefix ("คน" =
  // pedestrian, "รถ" = vehicle).
  const filteredRawRows = useMemo(() => {
    if (filter.status === 'ALL') return allRawRows
    return allRawRows.filter((r) => {
      const isVehicle = r.crosswalk.name_th.trim().startsWith('รถ')
      return filter.status === 'VEHICLE_VIOLATION' ? isVehicle : !isVehicle
    })
  }, [allRawRows, filter.status])

  // Client-side paginate the filtered result at 10 rows per page.
  const rows = useMemo<Row[]>(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredRawRows.slice(start, start + PAGE_SIZE).map((r, i) => ({
      ...r,
      seq: start + i + 1,
    }))
  }, [filteredRawRows, page])

  // `/details/list` response's `camera.sta` is often empty. Batch-fetch the
  // shared CCTV detail for each UNIQUE camera on the current page (a camera
  // can appear in many violation rows) to get its real `ip_address`. Reuses
  // the modal's `['cctv_detail', id]` key so opening the same camera later
  // is a cache hit.
  const uniqueCameraIds = useMemo(() => {
    const seen = new Set<string>()
    for (const r of rows) if (r.camera.id) seen.add(r.camera.id)
    return Array.from(seen)
  }, [rows])

  const cctvDetailResults = useQueries({
    queries: uniqueCameraIds.map((cameraId) => ({
      queryKey: ['cctv_detail', cameraId] as const,
      queryFn: () => getCCTVDetailAPI(cameraId),
      enabled: !!cameraId,
    })),
  })

  const ipByCameraId = useMemo(() => {
    const m = new Map<string, string | undefined>()
    uniqueCameraIds.forEach((cameraId, i) => {
      m.set(cameraId, cctvDetailResults[i]?.data?.data?.ip_address)
    })
    return m
  }, [uniqueCameraIds, cctvDetailResults])

  const columns: ColumnsType<Row> = [
    {
      title: 'ลำดับ',
      dataIndex: 'seq',
      key: 'seq',
      align: 'center',
      width: 80,
    },
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'center',
      width: 200,
      render: (_, row) => {
        // Backend returns pre-formatted Thai date-time, e.g. "22/06/2569 16:24".
        // Split on the first space so date + time can wrap independently.
        const [datePart, timePart] = (row.crosswalk.timestamp ?? '').split(' ')
        return (
          <div>
            <p className='mb-0'>{datePart || '-'}</p>
            <p className='mb-0 text-white/60'>{timePart ? `${timePart} น.` : ''}</p>
          </div>
        )
      },
    },
    {
      title: 'ประเภทเหตุการณ์',
      key: 'eventType',
      align: 'center',
      width: 260,
      render: (_, row) => (
        <span
          className={`inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border ${eventClass(row.crosswalk.name_th)}`}
        >
          {row.crosswalk.name_th}
        </span>
      ),
    },
    {
      title: 'กล้อง',
      key: 'camera',
      width: 400,
      render: (_, row) => row.camera.name,
    },
    {
      title: 'IP Address',
      key: 'ipAddress',
      align: 'center',
      width: 140,
      render: (_, row) => {
        const ip = ipByCameraId.get(row.camera.id)
        return ip || row.camera.sta || '-'
      },
    },
    {
      title: 'ภาพเหตุการณ์',
      dataIndex: 'image_path',
      key: 'image',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (src: string) =>
        src ? (
          <Image
            src={src}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='event'
          />
        ) : (
          <span className='text-white/40'>-</span>
        ),
    },
  ]

  // Pagination reflects the FILTERED client-side result set — not the raw
  // backend row count. When "รถฝ่าฝืน" is selected, only vehicle rows are
  // counted toward total pages.
  const totalPages = Math.max(1, Math.ceil(filteredRawRows.length / PAGE_SIZE))
  const showPagination = totalPages > 1

  return (
    <div className='flex flex-col gap-3'>
      <Table<Row>
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size='middle'
        // Backend has no unique event id; the same camera + timestamp collides
        // when two events land in the same minute (backend truncates to
        // "DD/MM/YYYY HH:mm"). `seq` is a per-page counter that stays unique
        // across pages via `(page - 1) * PAGE_SIZE + i + 1`.
        rowKey='seq'
        scroll={{ x: 'max-content' }}
        // Shared table skin — yellow row dividers + kill the right-fixed
        // scroll shadow. Same class the traffic-volume report tables use.
        className='bridge-projects-table'
      />
      {showPagination && (
        <BluePagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  )
}

export default React.memo<Props>(TableViolationData)
