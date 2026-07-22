"use client"
import React, { useMemo, useState } from 'react'
import { Empty, Image } from 'antd'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import { type ViolationFilter } from './filter'
import AppPagination from '@/components/pagination/AppPagination'
import { isVehicleViolation, parseViolationTimestamp, useViolationRows } from './useViolationRows'

interface Props {
  filter: ViolationFilter
  /** Reports pagination up to the parent section so the export modal's
   *  หน้าปัจจุบัน scope can mirror the exact rows this grid shows. */
  onPageChange?: (page: number, pageSize: number) => void
}

const PAGE_SIZE = 10

// Single event-type color across the violation tab (table + grid) per design.
const VIOLATION_COLOR = '#E94C4C'

// AntD's 24-column system can't split evenly into 5, so use CSS grid instead.
const GRID_CLASSES =
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'

const CCTVViolationData: React.FC<Props> = ({ filter, onPageChange }) => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const { pageRows, total, page, setPage, isLoading, pageStart } =
    useViolationRows(filter, pageSize)

  const { data: camerasData } = useCrosswalkCameras(deptId, { solution_id: id })
  const ipByCameraId = useMemo(() => {
    const m = new Map<string, string | undefined>()
    for (const c of camerasData?.cameras ?? []) m.set(c.id, c.ip_address)
    return m
  }, [camerasData])

  const showPagination = total > 0

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
          // Vehicle (รถ) violations are orange to match the stat card; the
          // default red (VIOLATION_COLOR) stays for pedestrian (คน).
          const color = isVehicleViolation(r.crosswalk.name_th)
            ? '#FF7B00'
            : VIOLATION_COLOR
          const ip = ipByCameraId.get(r.camera.id) || r.camera.sta || '-'
          return (
            <div
              key={`${pageStart + i}-${r.camera.id}-${r.crosswalk.timestamp}`}
              className='p-5 bg-(--gray) rounded-lg h-full flex flex-col'
            >
              {(() => {
                const { date, time } = parseViolationTimestamp(r.crosswalk.timestamp)
                return (
                  <div className='mb-2'>
                    <h4 style={{ color }}>{r.crosswalk.name_th}</h4>
                    <p className='fs-12 text-gray-400 mb-0'>
                      {date}
                      {time ? ` ${time} น.` : ''}
                    </p>
                  </div>
                )
              })()}
              {/* Fixed 16:9 keeps the "no image" placeholder aligned across
                * cards even when some siblings do have images. */}
              <figure className='aspect-video rounded-lg overflow-hidden mb-1.5 bg-black/40'>
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
                  IP Address : {ip}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {showPagination && (
        <AppPagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, s) => {
            setPage(p)
            setPageSize(s)
            onPageChange?.(p, s)
          }}
        />
      )}
    </div>
  )
}

export default React.memo<Props>(CCTVViolationData)
