"use client"
import React from 'react'
import { Empty, Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MobileCarByTDIDData, MobileCarData, MobileCarList } from '@/types/tracking/detail-api'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'
import { getRowNumber } from '@/utils/pagination'
import { WEIGHT_STATUS_WITH_PROPERTIES } from '@/constants/vehicle'
import { FALLBACK } from '@/constants'

const DEFAULT_PAGE_SIZE = 10

interface Props {
  data?: MobileCarData
  isLoading?: boolean
  isError?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number, pageSize: number) => void
}

type WeightStatusType = 'น้ำหนักปกติ' | 'น้ำหนักเกิน'
type FinalStatusType = 'น้ำหนักปกติ' | 'ยอมรับน้ำหนัก' | 'ดำเนินคดี'

interface DailyWeightRecord {
  key: string
  no: number
  date: string
  time: string
  plate: string
  vehicleType: string
  actualWeight: number
  stdWeight: number
  overweight: number
  vehicleImage: string
  slipImage: string
  statusWeight: WeightStatusType
  statusAxle: WeightStatusType
  status: FinalStatusType
}

const WEIGHT_STATUS_CLASS: Record<WeightStatusType, string> = {
  'น้ำหนักปกติ': 'border-(--yellow) text-(--yellow)',
  'น้ำหนักเกิน': 'border-orange-500 text-orange-500',
}

const FINAL_STATUS_CLASS: Record<FinalStatusType, string> = {
  'น้ำหนักปกติ': 'border-(--yellow) text-(--yellow)',
  'ยอมรับน้ำหนัก': 'border-teal-400 text-teal-400',
  'ดำเนินคดี': 'border-pink-500 text-pink-500',
}

const mockData: DailyWeightRecord[] = [
  {
    key: '1', no: 1,
    date: '20 เม.ย. 2569', time: '15:27:56 น.',
    plate: '82-9960 ร้อยเอ็ด',
    vehicleType: 'ประเภท 16 : รถพ่วง 6 เพลา 20 เส้น',
    actualWeight: 49.25, stdWeight: 50.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักเกิน', status: 'ยอมรับน้ำหนัก',
  },
  {
    key: '2', no: 2,
    date: '20 เม.ย. 2569', time: '15:18:52 น.',
    plate: '81-8980 ร้อยเอ็ด',
    vehicleType: 'ประเภท 2 : 2 เพลา 6 เส้น',
    actualWeight: 13.60, stdWeight: 15.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักปกติ', status: 'น้ำหนักปกติ',
  },
  {
    key: '3', no: 3,
    date: '20 เม.ย. 2569', time: '15:04:50 น.',
    plate: '70-3202 มุกดาหาร',
    vehicleType: 'ประเภท 11/4 : กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 8)',
    actualWeight: 55.50, stdWeight: 50.50, overweight: 5.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักเกิน', statusAxle: 'น้ำหนักเกิน', status: 'ดำเนินคดี',
  },
  {
    key: '4', no: 4,
    date: '20 เม.ย. 2569', time: '14:44:03 น.',
    plate: '82-6556 ร้อยเอ็ด',
    vehicleType: 'ประเภท 5 : พ่วง 3 เพลา 10 เส้น',
    actualWeight: 22.65, stdWeight: 25.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักปกติ', status: 'น้ำหนักปกติ',
  },
]

const StatusBadge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border ${cls}`}>
    {label}
  </span>
)

const TableMobileDailyWeight: React.FC<Props> = (props) => {
  const { data, isLoading, isError, page, pageSize, total, onPageChange } = props

  const columns: ColumnsType<MobileCarList> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'left',
      width: 70,
      fixed: 'left',
      className: 'col-road-code',
      render: (_, __, index) => getRowNumber(page ?? 1, pageSize ?? DEFAULT_PAGE_SIZE, index),
    },
    {
      title: 'วันที่และเวลา',
      dataIndex: 'create_date',
      key: 'create_date',
      align: 'left',
      width: 150,
      render: (item) => {
        if (item) {
          return (
            <div>
              <p className='fs-12 mb-0'>{dayjs(item, 'DD/MM/BBBB HH:mm:ss').format('DD MMM BBBB')}</p>
              <p className='fs-12 mb-0 text-white/60'>{dayjs(item, 'DD/MM/BBBB HH:mm:ss').format('HH:mm:ss')}</p>
            </div>
          )
        }
        return '-'
      },
    },
    {
      title: 'ทะเบียนรถ',
      dataIndex: 'lp_head',
      key: 'lp_head',
      align: 'left',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ประเภทรถ',
      dataIndex: 'vehicle_class_desc',
      key: 'vehicle_class_desc',
      align: 'left',
      width: 240,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'น้ำหนักที่ชั่งได้',
      dataIndex: 'gross_weight',
      key: 'gross_weight',
      align: 'left',
      width: 140,
      render: (item) => {
        if (item) return `${fmtNumber(Number(item), 2)} ตัน`
        return <p className='fs-12 text-white/25'>0.00 ตัน</p>
      }
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'legal_weight',
      key: 'legal_weight',
      align: 'left',
      width: 160,
      render: (item) => {
        if (item) return <p className='fs-12 text-(--yellow)'>{fmtNumber(Number(item), 2)} ตัน</p>
        return <p className='fs-12 text-white/25'>0.00 ตัน</p>
      }
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'gross_weight_over',
      key: 'gross_weight_over',
      align: 'left',
      width: 130,
      render: (item) => {
        if (item) return <p className='fs-12 text-red-500'>{fmtNumber(Number(item), 2)} ตัน</p>
        return <p className='fs-12 text-white/25'>0.00 ตัน</p>
      }
    },
    {
      title: 'ภาพรถบรรทุก',
      dataIndex: 'image_path1',
      key: 'image_path1',
      align: 'center',
      width: 130,
      render: (src: string) => {
        return (
          <Image
            src={src}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='vehicle'
            fallback={FALLBACK}
          />
        )
      },
    },
    {
      title: 'สลิปน้ำหนัก',
      dataIndex: 'image_path5',
      key: 'image_path5',
      align: 'center',
      width: 130,
      render: (src: string) => {
        return (
          <Image
            src={src}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='slip'
            fallback={FALLBACK}
          />
        )
      },
    },
    {
      title: 'สถานะน้ำหนักรวม',
      dataIndex: 'is_over_weight',
      key: 'is_over_weight',
      align: 'center',
      width: 150,
      render: (item) => {
        if (item === "Y") {
          return (
            <div className={`inline-block py-0.5 px-3 rounded-lg whitespace-nowrap border border-red-500`}>
              <p className='fs-12 text-red-500'>น้ำหนักเกิน</p>
            </div>
          )
        }

        return (
          <div className={`inline-block py-0.5 px-3 rounded-lg whitespace-nowrap border border-(--yellow) text-(--yellow)`}>
            <p className='fs-12 text-(--yellow)'>น้ำหนักปกติ</p>
          </div>
        )
      },
    },
    {
      title: 'สถานะเพลา',
      dataIndex: 'is_over_weight',
      key: 'is_over_weight',
      align: 'center',
      width: 140,
      render: (item) => {
        if (item === "P") {
          return (
            <div className={`inline-block py-0.5 px-3 rounded-lg whitespace-nowrap border border-orange-500`}>
              <p className='fs-12 text-orange-500'>น้ำหนักเกิน</p>
            </div>
          )
        }

        return (
          <div className={`inline-block py-0.5 px-3 rounded-lg whitespace-nowrap border border-(--yellow) text-(--yellow)`}>
            <p className='fs-12 text-(--yellow)'>น้ำหนักปกติ</p>
          </div>
        )
      },
    },
    // {
    //   title: 'สถานะ',
    //   dataIndex: 'status',
    //   key: 'status',
    //   align: 'center',
    //   width: 140,
    //   fixed: 'right',
    //   render: (val: FinalStatusType) => (
    //     <StatusBadge label={val} cls={FINAL_STATUS_CLASS[val]} />
    //   ),
    // },
  ]

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <Table<MobileCarList>
      columns={columns}
      dataSource={data?.data}
      pagination={{
        current: page,
        pageSize,
        total: total ?? 0,
        onChange: onPageChange,
        locale: { items_per_page: '/ หน้า' },
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
      }}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableMobileDailyWeight)
