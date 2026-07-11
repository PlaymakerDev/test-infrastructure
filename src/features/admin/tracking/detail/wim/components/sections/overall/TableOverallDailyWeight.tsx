"use client"
import React, { useMemo, useState } from 'react'
import { Empty, Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import type { DailyWeightLogRow } from '@/features/admin/tracking/detail/wim/hooks'
import QueryBoundary from '@/components/common/QueryBoundary'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
  isOverWeight?: 'Y' | 'N';
}

const DEFAULT_PAGE_SIZE = 10

const TableOverallDailyWeight: React.FC<Props> = (props) => {
  const { stationId, stationType, isOverWeight } = props
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevIsOverWeight, setPrevIsOverWeight] = useState(isOverWeight)
  if (isOverWeight !== prevIsOverWeight) {
    setPrevIsOverWeight(isOverWeight)
    setPage(1)
  }

  const { data, meta, isLoading, isError } = useDailyWeightLogList(
    stationId as string | number | undefined,
    stationType,
    page,
    pageSize,
    isOverWeight
  )

  const columns: ColumnsType<DailyWeightLogRow> = useMemo(() => [
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <div>
          <p className='fs-12 mb-0'>{dayjs(record.time_stamp).format('DD MMM BBBB')}</p>
          <p className='fs-12 mb-0 text-white/60'>{dayjs(record.time_stamp).format('HH:mm:ss')} น.</p>
        </div>
      ),
    },
    {
      title: 'ทะเบียนรถ',
      key: 'plate',
      align: 'center',
      width: 160,
      render: (_, record) => [record.lp_head_no, record.lp_head_province_name].filter(Boolean).join(' ') || '-',
    },
    {
      title: 'ประเภทรถ',
      dataIndex: 'vehicle_class_desc',
      key: 'vehicle_class_desc',
      align: 'center',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: 'น้ำหนักที่ชั่งได้',
      dataIndex: 'gross_weight',
      key: 'gross_weight',
      align: 'center',
      width: 140,
      render: (value?: string) => `${Number(value ?? 0).toFixed(3)} ตัน`,
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'legal_weight',
      key: 'legal_weight',
      align: 'center',
      width: 160,
      render: (value?: string) => (
        <span className='text-(--yellow)'>{Number(value ?? 0).toFixed(3)} ตัน</span>
      ),
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'gross_weight_over',
      key: 'gross_weight_over',
      align: 'center',
      width: 130,
      render: (value?: string) => {
        const numeric = Number(value ?? 0)
        return <span className={numeric > 0 ? 'text-red-500' : 'text-white/25'}>{numeric.toFixed(3)} ตัน</span>
      },
    },
    {
      // WIM's log list includes a speed reading; STATION's does not (it's a
      // static weighbridge, not a speed-sensing WIM sensor) — same gap as
      // CardCurrentWeightVehicle.
      title: 'ความเร็ว',
      dataIndex: 'speed',
      key: 'speed',
      align: 'center',
      width: 120,
      render: (value?: string) => value ? `${Number(value).toFixed(2)} กม./ชม.` : '-',
    },
    {
      title: 'ภาพป้ายทะเบียน',
      dataIndex: 'plate_image',
      key: 'plate_image',
      align: 'center',
      width: 130,
      render: (src?: string) => (
        src ? <Image src={src} width={100} height={60} className='rounded object-cover' alt='plate' /> : '-'
      ),
    },
    {
      title: 'ภาพลักษณะรถ',
      dataIndex: 'vehicle_image',
      key: 'vehicle_image',
      align: 'center',
      width: 130,
      render: (src?: string) => (
        src ? <Image src={src} width={100} height={60} className='rounded object-cover' alt='vehicle' /> : '-'
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'is_over_weight_desc',
      key: 'is_over_weight_desc',
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (value: string, record) => (
        <span
          className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${record.is_over_weight === 'Y' ? 'border-red-500 text-red-500' : 'border-(--yellow) text-(--yellow)'
            }`}
        >
          {value || '-'}
        </span>
      ),
    },
  ], [])

  if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description='ไม่พบข้อมูล' />

  return (
    <QueryBoundary isLoading={isLoading} isError={isError}>
      <Table<DailyWeightLogRow>
        columns={columns}
        dataSource={data}
        pagination={{
          current: page,
          pageSize,
          total: meta?.total ?? 0,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage)
            setPageSize(nextPageSize)
          },
        }}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description='ไม่พบข้อมูล' /> }}
      />
    </QueryBoundary>
  )
}

export default React.memo<Props>(TableOverallDailyWeight)
