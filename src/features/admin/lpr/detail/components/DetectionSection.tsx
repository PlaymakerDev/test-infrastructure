"use client"
import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { Table, Button, ConfigProvider, Empty, Input, DatePicker } from 'antd'
import thTH from 'antd/locale/th_TH'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbCamera, TbCalendar } from 'react-icons/tb'
import { useLPRPointPlates } from '@/hooks/queries/lpr'
import type { LPRPointPlate, LPRSource } from '@/types/lpr/lpr-api'
import { useLPRDetailContext } from '../context'
import PlateDetailModal from './PlateDetailModal'

dayjs.extend(relativeTime)
dayjs.extend(buddhistEra)

const { RangePicker } = DatePicker

const SOURCE_LABEL: Record<LPRSource, string> = { anpr: 'ANPR', wim: 'WIM' }
const SOURCE_COLOR: Record<LPRSource, string> = {
  anpr: '#66AEFF',
  wim: '#B57BFF',
}

/** Detail Tab 2 — full detection list with real filters wired to backend.
 *  Backend handles: source narrow (`source=anpr|wim`), plate substring
 *  search (`q=`), inclusive date range (`from=YYYY-MM-DD&to=YYYY-MM-DD`).
 *  Frontend batches cursor pages via useLPRPointPlates + shows a click-to-
 *  view Modal with full-size vehicle + plate images. */
const DetectionSection: React.FC = () => {
  const { solutionId } = useLPRDetailContext()

  const [sourceFilter, setSourceFilter] = useState<'all' | LPRSource>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ])
  const [modalItem, setModalItem] = useState<LPRPointPlate | null>(null)

  // Debounce plate search so we don't re-issue the query on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const from = dateRange[0]?.format('YYYY-MM-DD')
  const to = dateRange[1]?.format('YYYY-MM-DD')

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } = useLPRPointPlates(
    solutionId,
    {
      limit: 25,
      from,
      to,
      q: debouncedSearch || undefined,
      source: sourceFilter,
    },
  )

  const rows = useMemo(() => (data?.pages ?? []).flatMap((p) => p.res_data), [data])

  // Hide the ความเร็ว column entirely when every loaded row lacks a real speed
  // reading — ANPR-only sites always come through as speed=0/null (WIM is the
  // source that populates it), so showing a full column of "-" is just noise.
  const hasSpeed = useMemo(
    () => rows.some((r) => r.speed != null && r.speed > 0),
    [rows],
  )

  const columns: ColumnsType<LPRPointPlate> = useMemo(
    () => [
      {
        title: 'เวลา',
        key: 'captured_at',
        width: 170,
        render: (_, r) => (
          <div>
            <div className='fs-13 text-white tabular-nums'>
              {dayjs(r.captured_at).format('DD MMM · HH:mm:ss')}
            </div>
            <div className='fs-11 text-gray-500'>
              {dayjs(r.captured_at).locale('th').fromNow()}
            </div>
          </div>
        ),
      },
      {
        title: 'ทะเบียน',
        key: 'plate',
        render: (_, r) => (
          <div className='flex items-center gap-2'>
            {r.plate_image ? (
              <Image
                src={r.plate_image}
                alt={r.plate_number}
                width={70}
                height={30}
                unoptimized
                className='rounded object-cover shrink-0 w-[70px] h-[30px] bg-black'
              />
            ) : (
              <div className='w-[70px] h-[30px] rounded bg-black/40 shrink-0' />
            )}
            <div>
              <div className='fs-14 font-bold text-white tabular-nums'>
                {r.plate_number || '-'}
              </div>
              <div className='fs-11 text-gray-400'>{r.plate_province || ''}</div>
            </div>
          </div>
        ),
      },
      {
        title: 'ประเภทรถ',
        key: 'vehicle',
        render: (_, r) => (
          <div>
            <div className='fs-13 text-white'>{r.vehicle_type_name || '-'}</div>
            <div className='fs-11 text-gray-400'>
              {[r.vehicle_brand, r.vehicle_color !== '-' ? r.vehicle_color : null]
                .filter(Boolean)
                .join(' · ') || '-'}
            </div>
          </div>
        ),
      },
      ...(hasSpeed
        ? [
            {
              title: 'ความเร็ว',
              key: 'speed',
              width: 100,
              align: 'right' as const,
              render: (_: unknown, r: LPRPointPlate) =>
                r.speed != null && r.speed > 0 ? (
                  <span className='tabular-nums text-white'>
                    {r.speed.toLocaleString('th-TH')}{' '}
                    <span className='fs-11 text-gray-500'>กม./ชม.</span>
                  </span>
                ) : (
                  <span className='text-gray-500'>-</span>
                ),
            },
          ]
        : []),
      {
        title: 'กล้อง',
        key: 'camera',
        ellipsis: true,
        render: (_, r) => (
          <div className='flex items-center gap-1.5 text-gray-300 min-w-0'>
            <TbCamera size={14} className='shrink-0' />
            <span className='fs-12 truncate' title={r.camera_name || ''}>
              {r.camera_name || '-'}
            </span>
          </div>
        ),
      },
      {
        title: 'ที่มา',
        dataIndex: 'source',
        key: 'source',
        width: 90,
        align: 'center',
        render: (v: LPRSource) => (
          <span
            className='fs-11 font-semibold px-2 py-0.5 rounded-full'
            style={{
              background: `${SOURCE_COLOR[v]}22`,
              color: SOURCE_COLOR[v],
              border: `1px solid ${SOURCE_COLOR[v]}55`,
            }}
          >
            {SOURCE_LABEL[v]}
          </span>
        ),
      },
    ],
    [hasSpeed],
  )

  const applyPreset = (days: number) => {
    const end = dayjs()
    const start = end.subtract(days, 'day')
    setDateRange([start, end])
  }

  const clearAll = () => {
    setSourceFilter('all')
    setSearch('')
    setDateRange([null, null])
  }

  return (
    <div className='flex flex-col gap-4'>
      <section className='bg-(--mid-gray) rounded-2xl p-4 flex flex-col gap-3'>
        <div className='flex items-center gap-2 text-(--yellow)'>
          <TbCalendar size={16} />
          <h4 className='mb-0 fs-13'>ตัวกรอง</h4>
          <div className='ms-auto flex items-center gap-1'>
            {[
              { label: 'วันนี้', d: 0 },
              { label: '7 วัน', d: 7 },
              { label: '30 วัน', d: 30 },
            ].map((p) => (
              <button
                key={p.label}
                type='button'
                onClick={() => applyPreset(p.d)}
                className='fs-11 px-2 py-1 rounded-md bg-(--light-black) text-gray-300 hover:text-white hover:bg-black/40 transition-colors'
              >
                {p.label}
              </button>
            ))}
            <button
              type='button'
              onClick={clearAll}
              className='fs-11 px-2 py-1 rounded-md text-gray-500 hover:text-(--yellow) transition-colors'
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
        <div className='flex flex-col md:flex-row md:items-end gap-3'>
          {/* Date range — Thai BE year + yellow calendar icon, same pattern as
            * Traffic Volume's FilterBarReport (design 2026-07-20). */}
          <div className='flex flex-col gap-1'>
            <span className='fs-12 text-(--yellow)'>วันที่เริ่มต้นและสิ้นสุดแสดงข้อมูล</span>
            <ConfigProvider locale={thTH}>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(
                    (dates ?? [null, null]) as [dayjs.Dayjs | null, dayjs.Dayjs | null],
                  )
                }
                format='D MMM BBBB'
                placeholder={['วันเริ่ม', 'วันสิ้นสุด']}
                className='w-full! lg:w-72!'
                size='large'
                separator={<span className='text-white'>-</span>}
                suffixIcon={<TbCalendar className='text-(--yellow)' size={18} />}
                allowClear
              />
            </ConfigProvider>
          </div>
          <div className='flex items-center gap-1 bg-(--light-black) rounded-lg p-1'>
            {(['all', 'anpr', 'wim'] as const).map((s) => (
              <button
                key={s}
                type='button'
                onClick={() => setSourceFilter(s)}
                className={`px-3 py-1.5 rounded-md fs-12 transition-colors ${
                  sourceFilter === s
                    ? 'bg-(--yellow) text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'ทั้งหมด' : SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
          <Input
            allowClear
            size='middle'
            prefix={<TbSearch className='text-gray-400' />}
            placeholder='ค้นหาป้ายทะเบียน'
            className='md:max-w-xs'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className='md:ms-auto fs-11 text-gray-400'>
            แสดง {rows.length.toLocaleString('th-TH')} รายการ
            {isFetching && ' · กำลังโหลด…'}
          </div>
        </div>
      </section>

      <Table
        rowKey='id'
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size='middle'
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description='ไม่มีข้อมูลตรวจจับตามตัวกรอง' /> }}
        onRow={(row) => ({ onClick: () => setModalItem(row), className: 'cursor-pointer' })}
      />

      {hasNextPage && (
        <div className='flex justify-center'>
          <Button type='primary' loading={isFetching} onClick={() => fetchNextPage()}>
            โหลดเพิ่ม
          </Button>
        </div>
      )}

      <PlateDetailModal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  )
}

export default React.memo(DetectionSection)
