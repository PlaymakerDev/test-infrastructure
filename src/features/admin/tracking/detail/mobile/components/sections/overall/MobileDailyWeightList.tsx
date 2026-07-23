"use client"
import React, { useMemo } from 'react'
import { Empty, Pagination, Skeleton } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import CardList, { DataType } from '@/components/list/CardList'
import { MobileCarData } from '@/types/tracking/detail-api'
import { fmtNumber } from '@/utils/formatNumber'
import { ITS_WEIGHT_STATUS, VEHICLE_PROPERTIES } from '@/constants'

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

// Tailwind's scanner needs literal `text-[#hex]` strings to detect arbitrary
// values at build time — can't compute them from ITS_WEIGHT_STATUS.color via
// template literal (see OverallDailyWeightList.tsx's STATUS_MAP).
const STATUS_MAP: Record<string, string> = {
  'ยอมรับน้ำหนัก': 'text-teal-400',
  'ดำเนินคดี': 'text-pink-500',
  [ITS_WEIGHT_STATUS.N.text]: 'text-[#FCD116]',
  [ITS_WEIGHT_STATUS.Y.text]: 'text-[#E94C4C]',
  [ITS_WEIGHT_STATUS.P.text]: 'text-[#FF5733]',
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
        : (ITS_WEIGHT_STATUS[row.is_over_weight as keyof typeof ITS_WEIGHT_STATUS]?.text || ITS_WEIGHT_STATUS.N.text)

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
