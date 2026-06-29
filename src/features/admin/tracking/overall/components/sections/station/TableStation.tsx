"use client"
import React from 'react'
import { Table, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { SumStation } from '@/types/tracking/overall-api'
import { STATION_STATUS } from '@/constants'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: SumStation[]
  isLoading?: boolean
  isError?: boolean
}

const TableStation: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props;
  const router = useRouter()

  const columns: ColumnsType<SumStation> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 70,
      fixed: 'left',
      render: (_, __, index) => {
        return index + 1
      }
    },
    {
      title: 'สถานี',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      width: 300,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'total',
      key: 'total',
      align: 'center',
      sorter: (a, b) => (Number(a.total || 0) - Number(b.total || 0)),
      width: 150,
      render: (item) => {
        if (item) return fmtNumber(Number(item))
        return '-'
      }
    },
    {
      title: 'จำนวนรถน้ำหนักปกติ',
      dataIndex: 'normal',
      key: 'normal',
      align: 'center',
      width: 150,
      sorter: (a, b) => (Number(a.total || 0) - Number(a.over || 0)) - (Number(b.total || 0) - Number(b.over || 0)),
      render: (_, record) => {
        const normalCount = Number(record.total) - Number(record.over);
        if (!!normalCount) return <p className='fs-12 text-(--default-blue)'>{fmtNumber(normalCount)}</p>
        return <p className='fs-12 text-(--default-blue)'>-</p>
      },
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน',
      dataIndex: 'over',
      key: 'over',
      align: 'center',
      width: 150,
      sorter: (a, b) => (Number(a.over) || 0) - (Number(b.over) || 0),
      render: (item) => {
        if (item) return <p className='fs-12 text-red-500'>{fmtNumber(item)}</p>
        return <p className='fs-12 text-red-500'>-</p>
      }
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน 10%',
      dataIndex: 'over_10',
      key: 'over_10',
      align: 'center',
      width: 150,
      render: (item) => {
        if (item) return <p className='fs-12 text-(--yellow)'>{fmtNumber(item)}</p>
        return <p className='fs-12 text-(--yellow)'>-</p>
      }
    },
    {
      title: 'กล้อง CCTV',
      dataIndex: 'total_cctv',
      key: 'total_cctv',
      align: 'center',
      width: 150,
      sorter: (a, b) => (Number(a.total_cctv || 0)) - (Number(b.total_cctv || 0)),
      render: (item, record) => {
        const totalCCTV = Number(item || 0);
        const inactiveCCTV = Number(record.offline_cctv || 0);
        const activeCCTV = totalCCTV - inactiveCCTV;

        if (!!totalCCTV) return <p className='fs-12'><span className={activeCCTV > 0 ? 'text-green-500' : 'text-red-500'}>{fmtNumber(activeCCTV)}</span>/<span className='text-(--yellow)'>{fmtNumber(totalCCTV)}</span></p>
        return <p className='fs-12 text-white/50'>ไม่มีกล้อง</p>
      }
    },
    {
      title: 'ปีที่ส่งมอบ',
      dataIndex: 'delivery_year',
      key: 'delivery_year',
      align: 'center',
      width: 150,
      sorter: (a, b) => (a.delivery_year || '').localeCompare(b.delivery_year || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'เลขที่สัญญา',
      dataIndex: 'contract_number',
      key: 'contract_number',
      align: 'center',
      width: 150,
      sorter: (a, b) => (a.contract_number || '').localeCompare(b.contract_number || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'total_cctv',
      key: 'status',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (item, record) => {
        const totalCCTV = Number(item || 0);
        const inactiveCCTV = Number(record.offline_cctv || 0);
        const activeCCTV = totalCCTV - inactiveCCTV;

        let status = ''

        if (totalCCTV > 0) status = 'เปิดปกติ'
        if (totalCCTV === 0 && activeCCTV > 0) status = 'ไม่ส่งข้อมูล'
        if (totalCCTV === 0 && activeCCTV === 0) status = 'ระบบขัดข้อง'

        return (
          <div className='flex justify-center items-center'>
            <div className={`bg-[#66AEFF1A] border border-(${STATION_STATUS[status as keyof typeof STATION_STATUS].color}) px-3 py-1 rounded-3xl w-full lg:w-24`}>
              <p className={`fs-12 text-(${STATION_STATUS[status as keyof typeof STATION_STATUS].color}) mb-0`}>{STATION_STATUS[status as keyof typeof STATION_STATUS].text}</p>
            </div>
          </div>
        )
      },
    },
  ]

  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Table<SumStation>
      columns={columns}
      dataSource={data}
      pagination={{
        locale: { items_per_page: "/ หน้า" },
      }}
      size="middle"
      rowKey="station_id"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
      onRow={(record) => {
        return {
          onClick: () => router.push(`/admin/tracking/detail/station/${record.station_id}`),
          className: 'cursor-pointer',
        }
      }}
    />
  )
}

export default React.memo<Props>(TableStation)
