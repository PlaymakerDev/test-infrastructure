"use client"
import React from 'react'
import { Empty, Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MobileCarByTDIDData } from '@/types/tracking/detail-api'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: MobileCarByTDIDData[]
  isLoading?: boolean
  isError?: boolean
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
  const { data, isLoading, isError } = props

  const columns: ColumnsType<MobileCarByTDIDData> = [
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
      title: 'วันที่และเวลา',
      dataIndex: 'create_date',
      key: 'create_date',
      align: 'center',
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
      align: 'center',
      width: 150,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ประเภทรถบรรทุก',
      dataIndex: 'vehicle_class_desc',
      key: 'vehicle_class_desc',
      align: 'center',
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
      align: 'center',
      width: 140,
      render: (item) => {
        if (item) return fmtNumber(Number(item), 2)
        return '-'
      }
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'legal_weight',
      key: 'legal_weight',
      align: 'center',
      width: 160,
      render: (item) => {
        if (item) return <p className='fs-12 text-(--yellow)'>{fmtNumber(Number(item), 2)}</p>
        return '-'
      }
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'gross_weight_over',
      key: 'gross_weight_over',
      align: 'center',
      width: 130,
      render: (item) => {
        if (item) return <p className='fs-12 text-red-500'>{fmtNumber(Number(item), 2)}</p>
        return <p className='fs-12 text-white/25'>0</p>
      }
    },
    {
      title: 'ภาพรถบรรทุก',
      dataIndex: 'image_path1',
      key: 'image_path1',
      align: 'center',
      width: 130,
      render: (src: string) => {
        console.log(`${process.env.NEXT_PUBLIC_WTS_BASE_PATH}${src}`)
        return (
          <Image
            src={`${process.env.NEXT_PUBLIC_WTS_BASE_PATH}${src}`}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='vehicle'
          />
        )
      },
    },
    {
      title: 'สลิปน้ำหนัก',
      dataIndex: 'image_path6',
      key: 'image_path6',
      align: 'center',
      width: 130,
      render: (src: string) => {
        return (
          <Image
            src={`${process.env.NEXT_PUBLIC_WTS_BASE_PATH}${src}`}
            width={100}
            height={60}
            className='rounded object-cover'
            alt='slip'
          />
        )
      },
    },
    {
      title: 'สถานะน้ำหนักรวม',
      dataIndex: 'statusWeight',
      key: 'statusWeight',
      align: 'center',
      width: 150,
      // render: (val: WeightStatusType) => (
      //   <StatusBadge label={val} cls={WEIGHT_STATUS_CLASS[val]} />
      // ),
    },
    {
      title: 'สถานะเพลา',
      dataIndex: 'statusAxle',
      key: 'statusAxle',
      align: 'center',
      width: 140,
      // render: (val: WeightStatusType) => (
      //   <StatusBadge label={val} cls={WEIGHT_STATUS_CLASS[val]} />
      // ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      fixed: 'right',
      // render: (val: FinalStatusType) => (
      //   <StatusBadge label={val} cls={FINAL_STATUS_CLASS[val]} />
      // ),
    },
  ]

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <Table<MobileCarByTDIDData>
      columns={columns}
      dataSource={data}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
      loading={isLoading}
    />
  )
}

export default React.memo<Props>(TableMobileDailyWeight)
