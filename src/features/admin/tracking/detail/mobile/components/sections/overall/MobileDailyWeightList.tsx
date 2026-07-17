"use client"
import React, { useMemo } from 'react'
import { Empty, Pagination, Skeleton } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import CardList, { DataType } from '@/components/list/CardList'
import { MobileCarData } from '@/types/tracking/detail-api'
import { fmtNumber } from '@/utils/formatNumber'
import { VEHICLE_PROPERTIES } from '@/constants'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  data?: MobileCarData
  isLoading?: boolean
  isError?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number, pageSize: number) => void
}

const STATUS_MAP: Record<string, string> = {
  'น้ำหนักปกติ': 'text-(--yellow)',
  'ยอมรับน้ำหนัก': 'text-teal-400',
  'ดำเนินคดี': 'text-pink-500',
}

const MobileDailyWeightList: React.FC<Props> = (props) => {
  const { data, isLoading, isError, page, pageSize, total, onPageChange } = props

  const cards = useMemo<DataType[]>(() => (data?.data ?? []).map((row) => {
    const images = [
      row.image_path1 ? { image: row.image_path1, description: 'ภาพรถบรรทุก' } : null,
      row.image_path5 ? { image: row.image_path5, description: 'สลิปน้ำหนัก' } : null,
    ].filter((item): item is { image: string; description: string } => item !== null)

    const status = row.is_arrested
      ? 'ดำเนินคดี'
      : row.accept_weight
        ? 'ยอมรับน้ำหนัก'
        : (row.is_over_weight_desc || 'น้ำหนักปกติ')

    return {
      id: row.td_id,
      plate: row.lp_head || '-',
      vehicleType: row.vehicle_class_desc || '-',
      status,
      actualWeight: `${fmtNumber(Number(row.gross_weight) || 0, 2)} ตัน`,
      stdWeight: `${fmtNumber(Number(row.legal_weight) || 0, 2)} ตัน`,
      overweight: `${fmtNumber(Number(row.gross_weight_over) || 0, 2)} ตัน`,
      cargo: row.masterial_name || '-',
      datetime: dayjs(row.create_date, 'DD/MM/BBBB HH:mm:ss').format('DD MMM BBBB HH:mm:ss'),
      images,
      vehicleImage: VEHICLE_PROPERTIES[String(row.vehicle_class_id) as keyof typeof VEHICLE_PROPERTIES]?.vehicle?.image,
    }
  }), [data])

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
  if (cards.length === 0) return <Empty description="ไม่พบข้อมูล" />

  return (
    <div>
      <CardList data={cards} statusMap={STATUS_MAP} />
      <div className='mt-5 flex justify-end'>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total ?? 0}
          onChange={onPageChange}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(MobileDailyWeightList)
