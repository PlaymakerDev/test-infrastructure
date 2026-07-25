"use client"
import React, { useEffect, useState } from 'react'
import { Button, ConfigProvider, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MobileMasterData } from '@/types/tracking/detail-api'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { fmtNumber } from '@/utils/formatNumber'
import { useMobileMaster } from '../../../hooks'
import { useMobileContext } from '../../../context'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  /** Reports the rows currently visible on this table's page + the meta total
   *  (pagination is internal) so the parent's export dialog can offer a
   *  ทั้งหมด/หน้าปัจจุบัน scope. */
  onPageRowsChange?: (rows: MobileMasterData[], total: number) => void
}

const NA = <span className="text-white/30">ไม่ระบุ</span>

type StatusType = 'เปิดด่าน' | 'ปิดด่าน'

const STATUS_COLOR: Record<StatusType, string> = {
  "เปิดด่าน": "#66AEFF",
  "ปิดด่าน": "#E94C4C"
}

const DEFAULT_PAGE_SIZE = 10

const TableVehicleData: React.FC<Props> = ({ onPageRowsChange }) => {
  const { searchParams, setOpenMobileLog } = useMobileContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevSearchParams, setPrevSearchParams] = useState(searchParams)
  if (prevSearchParams !== searchParams) {
    setPrevSearchParams(searchParams)
    setPage(1)
  }

  const { data, isLoading, isError } = useMobileMaster({
    start_date: searchParams.start_date,
    end_date: searchParams.end_date,
    is_open: searchParams.is_open,
    page,
    page_size: pageSize,
  })

  const payload = data?.data
  useEffect(() => {
    onPageRowsChange?.(payload?.data ?? [], payload?.meta.total ?? 0)
  }, [payload, onPageRowsChange])

  const columns: ColumnsType<MobileMasterData> = [
    {
      title: 'ลำดับ',
      key: 'no',
      align: 'left',
      width: 70,
      fixed: 'left',
      className: 'col-road-code',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'วันที่',
      dataIndex: 'CreateDate',
      key: 'CreateDate',
      align: 'left',
      width: 140,
      render: (val: string) => val ? dayjs(val, 'DD/MM/BBBB').format('DD MMM BBBB') : NA,
    },
    {
      title: 'เวลาจัดตั้ง',
      dataIndex: 'TimeFrom',
      key: 'TimeFrom',
      align: 'left',
      width: 130,
      render: (val: string) => val ? `${val} น.` : NA,
    },
    {
      title: 'เวลาสิ้นสุด',
      dataIndex: 'TimeTo',
      key: 'TimeTo',
      align: 'left',
      width: 130,
      render: (val: string) => val ? `${val} น.` : NA,
    },
    {
      title: 'ร่วมบูรณาการ',
      dataIndex: 'Collaboration',
      key: 'Collaboration',
      align: 'left',
      width: 140,
      render: (val: string) => val ? val : NA,
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'Total',
      key: 'Total',
      align: 'center',
      width: 160,
      render: (val: string) => fmtNumber(Number(val)) || 0,
    },
    {
      title: 'จำนวนรถน้ำหนักรวมเกิน',
      dataIndex: 'TotalOver',
      key: 'TotalOver',
      align: 'center',
      width: 200,
      render: (val: string) => (
        <span className={Number(val) > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(Number(val)) || 0}</span>
      ),
    },
    {
      title: 'จำนวนรถน้ำหนักเพลาเกิน',
      dataIndex: 'AxisOver',
      key: 'AxisOver',
      align: 'center',
      width: 200,
      render: (val: string) => (
        <span className={Number(val) > 0 ? 'text-orange-500' : 'text-white/25'}>{fmtNumber(Number(val)) || 0}</span>
      ),
    },
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
              className='min-w-28'
              onClick={() => setOpenMobileLog({ open: true, record })}
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
    <Table<MobileMasterData>
      columns={columns}
      dataSource={data?.data.data}
      pagination={{
        current: page,
        pageSize,
        total: data?.data.meta.total ?? 0,
        onChange: (nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        },
        locale: { items_per_page: '/ หน้า' },
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
      }}
      size="middle"
      rowKey="TID"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableVehicleData)
