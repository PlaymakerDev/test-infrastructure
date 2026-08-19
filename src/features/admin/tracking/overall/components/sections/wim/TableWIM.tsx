"use client"
import React, { useState } from 'react'
import { Table, Empty, ConfigProvider, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { ProjectInfoIcon } from '@/components/modal'
import { SumWim } from '@/types/tracking/overall-api'
import { fmtNumber } from '@/utils/formatNumber'
import { getRowNumber } from '@/utils/pagination'

const DEFAULT_PAGE_SIZE = 10

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
  // Table paginates client-side over the full `data` array (no server pagination),
  // so ลำดับ must track the antd-reported page/pageSize itself to keep numbering
  // continuous instead of resetting to 1 on every page.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const columns: ColumnsType<SumWim> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'left',
      width: 70,
      fixed: 'left',
      className: 'col-road-code',
      render: (_, __, index) => getRowNumber(page, pageSize, index),
    },
    {
      title: 'Weight in Motion (WIM)',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      width: 300,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      // Station name + the same ⓘ the เลขที่สัญญา column uses elsewhere. The
      // WTS sum response carries `its_project_id`, so the row can open the
      // central Project Info modal; it's greyed out when that id is null
      // (station not linked to an ITS project). No road id in this response —
      // the modal's หน่วยงานรับผิดชอบ field falls back to '-'.
      render: (item, record) => (
        <span className='inline-flex items-center gap-1.5'>
          <span>{item || '-'}</span>
          <ProjectInfoIcon projectId={record.its_project_id} />
        </span>
      ),
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
      // Field is `over_10percent` on the sum endpoint — `over_10` doesn't exist
      // in the response, so this column rendered '-' for every row.
      dataIndex: 'over_10percent',
      key: 'over_10percent',
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
        return <p className='fs-12 text-white/50'>ไม่ระบุ</p>
      }
    },
    // {
    //   title: 'เลขที่สัญญา',
    //   dataIndex: 'contract_number',
    //   key: 'contract_number',
    //   align: 'center',
    //   width: 150,
    //   sorter: (a, b) => (a.contract_number || '').localeCompare(b.contract_number || ''),
    //   render: (item) => {
    //     if (item) return item
    //     return '-'
    //   }
    // },
    {
      title: 'สถานะ',
      dataIndex: 'total',
      key: 'total',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (item, record) => {
        const total = Number(item) || 0;
        const totalCCTV = Number(record.total_cctv) || 0;
        const offlineCCTV = Number(record.offline_cctv) || 0;
        const onlineCCTV = totalCCTV - offlineCCTV;

        // Priority ordered so a station with all cameras offline renders
        // "ไม่ส่งข้อมูล" (yellow) rather than "เปิดปกติ" (green). The old
        // cascade tested totalCCTV against 0 in every branch, leaving the
        // middle case unreachable (activeCCTV can never be > 0 when
        // totalCCTV === 0 by arithmetic).
        let status: StatusType
        if (total > 0) status = 'เปิดปกติ'
        else if (total === 0 && onlineCCTV > 0) status = 'ไม่ส่งข้อมูล'
        else if (total === 0 && onlineCCTV === 0) status = 'ระบบขัดข้อง'
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
              className='min-w-28'
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
        current: page,
        pageSize,
        onChange: (nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        },
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
