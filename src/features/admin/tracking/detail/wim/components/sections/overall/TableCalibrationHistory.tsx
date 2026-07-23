import { CalibrationHistoryData } from '@/types/tracking/detail-api'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React from 'react'
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);


interface Props {
  data?: CalibrationHistoryData[]
  isLoading?: boolean
}

type StatusType = 'valid' | 'near_expiry' | 'expired' | 'no_record'

const STATUS_CLASS: Record<StatusType, string> = {
  'valid': 'border-[#52c41a] text-[#52c41a]',
  'near_expiry': 'border-[#faad14] text-[#faad14]',
  'expired': 'border-[#ff4d4f] text-[#ff4d4f]',
  'no_record': 'border-[#d9d9d9] text-[#d9d9d9]',
}

const TableCalibrationHistory: React.FC<Props> = (props) => {
  const { data, isLoading } = props

  const columns: ColumnsType<CalibrationHistoryData> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'left',
      width: 70,
      fixed: 'left',
      className: 'col-road-code',
      render: (_, __, index) => {
        return index + 1
      }
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
              <p className='fs-12 mb-0 text-white/60'>{dayjs(item).fromNow()}</p>
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
        if (item) {
          return (
            <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${STATUS_CLASS[item as StatusType]}`}>
              {item}
            </span>
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
