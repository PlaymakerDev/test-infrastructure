"use client"
import React from 'react'
import { Table, Empty, ConfigProvider, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { MobileMasterData } from '@/types/tracking/overall-api'
import { fmtNumber } from '@/utils/formatNumber'
import { WIMMetaData } from '@/types/shared'

interface Props {
  data?: MobileMasterData[]
  meta?: WIMMetaData
  isLoading?: boolean
  isError?: boolean
  page?: number
  pageSize?: number
  onPageChange?: (page: number, pageSize: number) => void
}

type StatusType = 'เปิดด่าน' | 'ปิดด่าน'

const STATUS_COLOR: Record<StatusType, string> = {
  "เปิดด่าน": "#66AEFF",
  "ปิดด่าน": "#E94C4C"
}

const TableMobileData: React.FC<Props> = (props) => {
  const { data, isError, isLoading, meta, page, pageSize, onPageChange } = props;
  const router = useRouter()

  const columns: ColumnsType<MobileMasterData> = [
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
      title: 'รหัสสายทาง',
      dataIndex: 'WayID',
      key: 'WayID',
      align: 'center',
      width: 120,
      sorter: (a, b) => (a.WayID || '').localeCompare(b.WayID || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'Province',
      key: 'Province',
      align: 'center',
      width: 140,
      sorter: (a, b) => (a.Province || '').localeCompare(b.Province || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'หน่วยที่จัดตั้ง',
      dataIndex: 'DeptName',
      key: 'DeptName',
      align: 'center',
      width: 200,
      sorter: (a, b) => (a.DeptName || '').localeCompare(b.DeptName || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'บูรณาการ',
      dataIndex: 'Collaboration',
      key: 'Collaboration',
      align: 'center',
      width: 160,
      sorter: (a, b) => (a.Collaboration || '').localeCompare(b.Collaboration || ''),
      render: (item) => {
        if (item) return item
        return <p className='fs-12 text-white/50'>ไม่ร่วมบูรณาการ</p>
      }
    },
    {
      title: 'เวลาตั้งด่าน',
      dataIndex: 'TimeFrom',
      key: 'TimeFrom',
      align: 'center',
      width: 120,
      sorter: (a, b) => (a.TimeFrom || '').localeCompare(b.TimeFrom || ''),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'เวลาสิ้นสุด',
      dataIndex: 'TimeTo',
      key: 'TimeTo',
      align: 'center',
      width: 140,
      sorter: (a, b) => (a.TimeTo || '').localeCompare(b.TimeTo || ''),
      render: (item) => {
        if (item) return item
        return <p className='fs-12 text-orange-400'>ยังไม่สิ้นสุด</p>
      }
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'Total',
      key: 'Total',
      align: 'center',
      width: 150,
      sorter: (a, b) => (Number(a.Total || 0) - Number(b.Total || 0)),
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จำนวนรถน้ำหนักปกติ',
      dataIndex: 'TotalNormal',
      key: 'TotalNormal',
      align: 'center',
      width: 170,
      sorter: (a, b) => (Number(a.Total || 0) - Number(a.TotalOver || 0)) - (Number(b.Total || 0) - Number(b.TotalOver || 0)),
      render: (_, record) => {
        const normalCount = Number(record.Total) - Number(record.TotalOver);
        if (!!normalCount) return <p className='fs-12 text-(--default-blue)'>{fmtNumber(normalCount)}</p>
        return <p className='fs-12 text-(--default-blue)'>-</p>
      },
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน',
      dataIndex: 'TotalOver',
      key: 'TotalOver',
      align: 'center',
      width: 170,
      sorter: (a, b) => (Number(a.TotalOver) || 0) - (Number(b.TotalOver) || 0),
      render: (item) => {
        if (item) return <p className='fs-12 text-red-500'>{fmtNumber(item)}</p>
        return <p className='fs-12 text-red-500'>-</p>
      }
    },
    // {
    //   title: 'จำนวนรถน้ำหนักเกิน 10%',
    //   dataIndex: 'TotalOver10Percent',
    //   key: 'TotalOver10Percent',
    //   align: 'center',
    //   width: 190,
    //   render: (item) => {
    //     if (item) return <p className='fs-12 text-(--yellow)'>{fmtNumber(item)}</p>
    //     return <p className='fs-12 text-(--yellow)'>-</p>
    //   }
    // },
    {
      title: 'สถานะ',
      dataIndex: 'IsOpen',
      key: 'IsOpen',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: (item, record) => {
        let statusText = ''

        if (item === 0) statusText = 'ปิดด่าน'
        if (item === 1) statusText = 'เปิดด่าน'

        const color = STATUS_COLOR[statusText as StatusType] || '#66AEFF'
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
              onClick={() => router.push(`/admin/tracking/detail/mobile/${record.TID}`)}
            >
              <p className='fs-12'>{statusText}</p>
            </Button>
          </ConfigProvider>
        )
      },
    },
  ]

  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <div>
      <h3 className='text-(--yellow) font-normal! mb-3'>ตารางจุดตั้งด่านประจำวัน</h3>
      <Table<MobileMasterData>
        columns={columns}
        dataSource={data}
        className='bridge-projects-table'
        pagination={{
          current: page,
          pageSize,
          total: meta?.total ?? 0,
          onChange: onPageChange,
          locale: { items_per_page: "/ หน้า" },
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
        }}
        size="middle"
        rowKey="TID"
        scroll={{ x: 'max-content' }}
        loading={isLoading}
      />
    </div>
  )
}

export default React.memo<Props>(TableMobileData)
