"use client"
import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { Table, Button, Empty, Input, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbCamera } from 'react-icons/tb'
import { useLPRPointPlates } from '@/hooks/queries/lpr'
import type { LPRPointPlate, LPRSource } from '@/types/lpr/lpr-api'
import { useLPRDetailContext } from '../context'

dayjs.extend(relativeTime)

const SOURCE_LABEL: Record<LPRSource, string> = { anpr: 'ANPR', wim: 'WIM' }
const SOURCE_COLOR: Record<LPRSource, string> = {
  anpr: '#66AEFF',
  wim: '#B57BFF',
}

const resolveImg = (path?: string | null): string => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = process.env.NEXT_PUBLIC_HOST_BACKEND ?? ''
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Detail Tab 2 — full detection list.
 *  Infinite-scroll (via "โหลดเพิ่ม" button) over the cursor-paginated
 *  /lpr/points/:id/plates stream. Client-side filter for source + plate
 *  search (backend doesn't accept those params yet — keeps it snappy on
 *  the loaded page). Row click opens a modal with the full-size vehicle
 *  + plate crop image, kept out-of-flow so the table stays scrollable. */
const DetectionSection: React.FC = () => {
  const { solutionId } = useLPRDetailContext()
  const [sourceFilter, setSourceFilter] = useState<'all' | LPRSource>('all')
  const [search, setSearch] = useState('')
  const [modalItem, setModalItem] = useState<LPRPointPlate | null>(null)

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
    useLPRPointPlates(solutionId, 25)

  const rows = useMemo(() => {
    const all = (data?.pages ?? []).flatMap((p) => p.res_data)
    const term = search.trim().toLowerCase()
    return all.filter((r) => {
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
      if (term && !(r.plate_number ?? '').toLowerCase().includes(term)) return false
      return true
    })
  }, [data, sourceFilter, search])

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
                src={resolveImg(r.plate_image)}
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
      {
        title: 'ความเร็ว',
        key: 'speed',
        width: 100,
        align: 'right',
        render: (_, r) =>
          r.speed != null && r.speed > 0 ? (
            <span className='tabular-nums text-white'>
              {r.speed.toLocaleString('th-TH')}{' '}
              <span className='fs-11 text-gray-500'>กม./ชม.</span>
            </span>
          ) : (
            <span className='text-gray-500'>-</span>
          ),
      },
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
        filters: [
          { text: 'ANPR', value: 'anpr' },
          { text: 'WIM', value: 'wim' },
        ],
        onFilter: (val, r) => r.source === val,
      },
    ],
    [],
  )

  return (
    <div className='flex flex-col gap-4'>
      <section className='flex flex-col md:flex-row md:items-center gap-3'>
        <div className='flex items-center gap-1 bg-(--mid-gray) rounded-lg p-1'>
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
          className='max-w-xs'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className='ms-auto fs-11 text-gray-400'>
          แสดง {rows.length.toLocaleString('th-TH')} รายการ
          {isFetching && ' · กำลังโหลด…'}
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
        locale={{ emptyText: <Empty description='ไม่มีข้อมูลตรวจจับ' /> }}
        onRow={(row) => ({ onClick: () => setModalItem(row), className: 'cursor-pointer' })}
      />

      {hasNextPage && (
        <div className='flex justify-center'>
          <Button
            type='primary'
            loading={isFetching}
            onClick={() => fetchNextPage()}
          >
            โหลดเพิ่ม
          </Button>
        </div>
      )}

      <Modal
        open={!!modalItem}
        onCancel={() => setModalItem(null)}
        footer={null}
        title={modalItem ? `${modalItem.plate_number} · ${modalItem.plate_province}` : ''}
        width={720}
      >
        {modalItem && (
          <div className='flex flex-col gap-3'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {modalItem.vehicle_image && (
                <Image
                  src={resolveImg(modalItem.vehicle_image)}
                  alt='vehicle'
                  width={640}
                  height={360}
                  unoptimized
                  className='w-full h-auto rounded-lg bg-black'
                />
              )}
              {modalItem.plate_image && (
                <Image
                  src={resolveImg(modalItem.plate_image)}
                  alt='plate'
                  width={640}
                  height={360}
                  unoptimized
                  className='w-full h-auto rounded-lg bg-black object-contain'
                />
              )}
            </div>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-1 fs-13'>
              <dt className='text-gray-400'>เวลา</dt>
              <dd>{modalItem.captured_at_display}</dd>
              <dt className='text-gray-400'>กล้อง</dt>
              <dd>{modalItem.camera_name || '-'}</dd>
              <dt className='text-gray-400'>ที่มา</dt>
              <dd>{SOURCE_LABEL[modalItem.source]}</dd>
              <dt className='text-gray-400'>ประเภทรถ</dt>
              <dd>{modalItem.vehicle_type_name || '-'}</dd>
              <dt className='text-gray-400'>ยี่ห้อ</dt>
              <dd>{modalItem.vehicle_brand || '-'}</dd>
              <dt className='text-gray-400'>สี</dt>
              <dd>{modalItem.vehicle_color || '-'}</dd>
              {modalItem.speed != null && (
                <>
                  <dt className='text-gray-400'>ความเร็ว</dt>
                  <dd>
                    {modalItem.speed.toLocaleString('th-TH')} กม./ชม.
                  </dd>
                </>
              )}
              {modalItem.is_overweight != null && (
                <>
                  <dt className='text-gray-400'>น้ำหนักเกิน</dt>
                  <dd className={modalItem.is_overweight ? 'text-red-400' : ''}>
                    {modalItem.is_overweight ? 'ใช่' : 'ไม่'}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default React.memo(DetectionSection)
