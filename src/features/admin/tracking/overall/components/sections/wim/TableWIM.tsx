"use client"
import React from 'react'
import { Table, Empty, ConfigProvider, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { SumWim } from '@/types/tracking/overall-api'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: SumWim[]
  isLoading?: boolean
  isError?: boolean
}

type StatusType = 'เปิดปกติ' | 'ระบบขัดข้อง' | 'ไม่ส่งข้อมูล'

const STATUS_COLOR: Record<StatusType, string> = {
  'เปิดปกติ': '#66AEFF',
  'ระบบขัดข้อง': '#FCD116',
  'ไม่ส่งข้อมูล': '#EF4444',
}

const TableWIM: React.FC<Props> = (props) => {
  const { data, isError, isLoading } = props;
  const router = useRouter()

  const columns: ColumnsType<SumWim> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'left',
      width: 70,
      fixed: 'left',
      render: (_, __, index) => {
        return index + 1
      }
    },
    {
      title: 'Weight in Motion (WIM)',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
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

        // Priority ordered so a station with cameras that are ALL offline
        // renders "ไม่ส่งข้อมูล" (yellow) instead of "เปิดปกติ" (green) — the
        // previous conditional cascade compared totalCCTV to 0 in every
        // branch, making the middle "no active but total > 0" case
        // unreachable (activeCCTV can never be > 0 while totalCCTV === 0).
        let status: StatusType
        if (activeCCTV > 0) status = 'เปิดปกติ'
        else if (totalCCTV > 0) status = 'ไม่ส่งข้อมูล'
        else status = 'ระบบขัดข้อง'

        const color = STATUS_COLOR[status]
        return (
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: color,
                colorTextLightSolid: 'black'
              }
            }}
          >
            <Button
              type="primary"
              shape="round"
              onClick={() => router.push(`/admin/tracking/detail/wim/${record.station_id}?station_type=WIM`)}
            >
              <p className='fs-12'>{status}</p>
            </Button>
          </ConfigProvider>
        )
      },
    },
  ]

  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Table<SumWim>
      columns={columns}
      dataSource={data}
      className='bridge-projects-table'
      pagination={{
        locale: { items_per_page: "/ หน้า" },
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
      }}
      size="middle"
      rowKey="station_id"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
    />
  )
}

export default React.memo<Props>(TableWIM)
