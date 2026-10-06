import { VEHICLE_TYPE_COLOR } from '@/constants';
import { useAppDispatch } from '@/stores/hooks';
import { setLicenseDetailModalOpen } from '@/stores/reducers/modal/customModalSlice';
import { APIResponseLPRPlateList, LPRPlateData } from '@/types/lpr/new-lpr-api';
import { Image, Table, TableProps } from 'antd';
import React from 'react'

interface Props {
  data?: APIResponseLPRPlateList
  isLoading?: boolean
  isError?: boolean
  page: number
  limit: number
  onPageChange: (page: number, limit: number) => void
}

// confidence is a 0–100 percent: 0–20 orange, 21–40 yellow, 41–100 green.
// Boundaries are `<=` so a fractional value (20.5, 40.5) lands in the next band up.
export const getConfidenceColor = (confidence: number): string => {
  if (confidence <= 20) return '#FF7B00'
  if (confidence <= 40) return 'var(--yellow)'
  return '#B2FF00'
}

/** API value → a usable percent, or null when it's missing/blank/non-numeric
 *  (callers show '-'). Number('') is 0, so blanks are rejected before the cast. */
export const parseConfidence = (value: unknown): number | null => {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const TableDetectionData: React.FC<Props> = (props) => {
  const { data, isLoading, page, limit, onPageChange } = props
  const dispatch = useAppDispatch()

  const columns: TableProps<LPRPlateData>['columns'] = [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'captured_at_display',
      key: 'captured_at_display',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ป้ายทะเบียน',
      dataIndex: 'plate_number',
      key: 'plate_number',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'จังหวัด',
      dataIndex: 'plate_province',
      key: 'plate_province',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ประเภทรถ',
      dataIndex: 'vehicle_type_name',
      key: 'vehicle_type_name',
      width: 150,
      render: (item) => {
        const tagClassName = `inline-block border rounded-3xl px-3 text-center`
        return (
          <div
            className={tagClassName}
            style={{
              color: VEHICLE_TYPE_COLOR[item as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
              borderColor: VEHICLE_TYPE_COLOR[item as keyof typeof VEHICLE_TYPE_COLOR] || '#FFFFFF50',
            }}
          >
            <p className='fs-12'>{item || 'ไม่ระบุ'}</p>
          </div>
        )
      }
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 150,
      render: (item) => {
        const confidence = parseConfidence(item)
        if (confidence == null) return '-'
        const color = getConfidenceColor(confidence)
        return (
          <div
            className='inline-block border rounded-3xl px-3 text-center'
            style={{ color, borderColor: color }}
          >
            <p className='fs-12'>{confidence.toFixed(1)}%</p>
          </div>
        )
      }
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'IP Address',
      dataIndex: 'camera_ip',
      key: 'camera_ip',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ภาพป้ายทะเบียน',
      dataIndex: 'plate_image',
      key: 'plate_image',
      width: 150,
      render: (item) => {
        return (
          <div className='inline-flex justify-center'>
            <figure
              className='w-full h-16 relative overflow-hidden rounded-sm'
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={item}
                alt={item}
                width={'100%'}
                height={'100%'}
                className='object-cover object-center'
              />
            </figure>
          </div>
        )
      }
    },
  ];

  return (
    <Table<LPRPlateData>
      rowKey="id"
      columns={columns}
      dataSource={data?.res_data}
      loading={isLoading}
      size="middle"
      pagination={{
        current: page,
        pageSize: limit,
        total: data?.meta_data?.count,
        showSizeChanger: true,
        placement: ['bottomEnd'],
        onChange: onPageChange,
        locale: { items_per_page: '/ หน้า' }
      }}
      onRow={(record) => {
        return {
          className: 'cursor-pointer',
          onClick: () => dispatch(setLicenseDetailModalOpen({ open: true, data: record }))
        }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableDetectionData)
