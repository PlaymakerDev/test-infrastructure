import { CalibrationHistoryData } from '@/types/tracking/detail-api'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import relativeTime from 'dayjs/plugin/relativeTime';
import { getRowNumber } from '@/utils/pagination'

dayjs.extend(relativeTime);

const DEFAULT_PAGE_SIZE = 10


interface Props {
  data?: CalibrationHistoryData[]
  isLoading?: boolean
}

type StatusType = 'valid' | 'near_expiry' | 'expired' | 'no_record'

// Mirrors this feature's own status palette (TableVehicleData/TableStation/TableWIM's
// เปิดปกติ=blue / ระบบขัดข้อง=yellow / ไม่ส่งข้อมูล=red triad) instead of AntD's
// default success/warning/error/disabled colors, which clash with the app's theme.
const STATUS_CLASS: Record<StatusType, { className: string; color: string; text: string }> = {
  'valid': {
    className: 'border-(--default-blue) text-(--default-blue)',
    color: 'var(--default-blue)',
    text: 'อยู่ในระยะใช้งาน'
  },
  'near_expiry': {
    className: 'border-(--yellow) text-(--yellow)',
    color: 'var(--yellow)',
    text: 'ใกล้หมดอายุ'
  },
  'expired': {
    className: 'border-(--default-red) text-(--default-red)',
    color: 'var(--default-red)',
    text: 'หมดอายุ'
  },
  'no_record': {
    className: 'border-(--light-gray-3) text-(--light-gray-3)',
    color: 'var(--light-gray-3)',
    text: 'ไม่มีข้อมูล'
  },
}

const TableCalibrationHistory: React.FC<Props> = (props) => {
  const { data, isLoading } = props
  // Table paginates client-side over the full `data` array (no server pagination),
  // so ลำดับ must track the antd-reported page/pageSize itself to keep numbering
  // continuous instead of resetting to 1 on every page.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const columns: ColumnsType<CalibrationHistoryData> = [
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
      title: 'วันที่ Calibrate',
      dataIndex: 'calibrationDate',
      key: 'calibrationDate',
      width: 200,
      render: (item) => {
        if (item) {
          return (
            <div>
              <p className='fs-12 mb-0'>{dayjs(item).format('DD MMM BBBB')}</p>
              <p className='fs-12 mb-0 text-white/60'>({dayjs(item).fromNow()})</p>
            </div>
          )
        }
        return '-'
      }
    },
    {
      title: 'กำหนด Calibrate ครั้งถัดไป',
      dataIndex: 'nextCalibrationDate',
      key: 'nextCalibrationDate',
      width: 200,
      render: (item) => {
        if (item) return dayjs(item).format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'ผู้ทำการ Calibrate',
      dataIndex: 'calibrationBy',
      key: 'calibrationBy',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'บริษัท',
      dataIndex: 'calibrationCompany',
      key: 'calibrationCompany',
      width: 300,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'เลขที่ Certificate',
      dataIndex: 'certificateNo',
      key: 'certificateNo',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'remark',
      key: 'remark',
      width: 300,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: (item) => {
        const status = STATUS_CLASS[item as StatusType]
        if (status) {
          return (
            <div
              className={`inline-block py-0.5 px-3 rounded-lg whitespace-nowrap border`}
              style={{ borderColor: status?.color, color: status?.color }}
            >
              <p className='fs-12'>{status?.text || '-'}</p>
            </div>
          )
        }
        return '-'
      },
    },
  ]

  return (
    <Table<CalibrationHistoryData>
      columns={columns}
      dataSource={data}
      pagination={{
        current: page,
        pageSize,
        onChange: (nextPage, nextPageSize) => {
          setPage(nextPage)
          setPageSize(nextPageSize)
        },
        locale: { items_per_page: "/ หน้า" },
      }}
      size="middle"
      rowKey="station_id"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableCalibrationHistory)
