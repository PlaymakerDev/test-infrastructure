"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Empty, Pagination } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import CardList, { DataType } from '@/components/list/CardList'
import QueryBoundary from '@/components/common/QueryBoundary'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import type { DailyWeightLogRow } from '@/features/admin/tracking/detail/wim/hooks'
import { ITS_WEIGHT_STATUS, VEHICLE_PROPERTIES } from '@/constants'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
  isOverWeight?: 'Y' | 'N';
  date?: string;
  /** Reports the rows currently visible on this list's page (pagination is
   *  internal) so the parent's export dialog can offer a หน้าปัจจุบัน scope. */
  onPageRowsChange?: (rows: DailyWeightLogRow[]) => void;
}

// Tailwind's scanner needs literal `text-[#hex]` strings to detect arbitrary
// values at build time — can't compute them from ITS_WEIGHT_STATUS.color via
// template literal (same gotcha CardList's own class maps guard against).
const STATUS_MAP: Record<string, string> = {
  [ITS_WEIGHT_STATUS.N.text]: 'text-[#FCD116]',
  [ITS_WEIGHT_STATUS.Y.text]: 'text-[#E94C4C]',
  [ITS_WEIGHT_STATUS.P.text]: 'text-[#FF5733]',
}

const DEFAULT_PAGE_SIZE = 10

const OverallDailyWeightList: React.FC<Props> = (props) => {
  const { stationId, stationType, isOverWeight, date, onPageRowsChange } = props
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevIsOverWeight, setPrevIsOverWeight] = useState(isOverWeight)
  if (isOverWeight !== prevIsOverWeight) {
    setPrevIsOverWeight(isOverWeight)
    setPage(1)
  }

  const { data, meta, isLoading, isError } = useDailyWeightLogList(
    stationId as string | number | undefined,
    stationType,
    page,
    pageSize,
    isOverWeight,
    date
  )

  useEffect(() => {
    onPageRowsChange?.(data)
  }, [data, onPageRowsChange])

  const cards = useMemo<DataType[]>(() => data.map((row) => {
    const images = [
      row.plate_image ? { image: row.plate_image, description: 'ภาพป้ายทะเบียน' } : null,
      row.vehicle_image ? { image: row.vehicle_image, description: 'ภาพลักษณะรถ' } : null,
    ].filter((item): item is { image: string; description: string } => item !== null)

    return {
      id: row.key,
      plate: [row.lp_head_no, row.lp_head_province_name].filter(Boolean).join(' ') || '-',
      vehicleType: row.vehicle_class_desc || '-',
      status: ITS_WEIGHT_STATUS[row.is_over_weight as keyof typeof ITS_WEIGHT_STATUS]?.text || '-',
      actualWeight: `${Number(row.gross_weight ?? 0).toFixed(3)} ตัน`,
      stdWeight: `${Number(row.legal_weight ?? 0).toFixed(3)} ตัน`,
      overweight: `${Number(row.gross_weight_over ?? 0).toFixed(3)} ตัน`,
      speed: row.speed ? `${Number(row.speed).toFixed(2)} กม./ชม.` : '-',
      datetime: dayjs(row.time_stamp, 'DD/MM/BBBB  HH:mm:ss').format('DD MMM BBBB HH:mm:ss'),
      images,
      // Generic per-vehicle-class silhouette — same lookup as CardCurrentWeightVehicle.
      vehicleImage: VEHICLE_PROPERTIES[String(row.vehicle_class_id) as keyof typeof VEHICLE_PROPERTIES]?.vehicle?.image,
    }
  }), [data])

  if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description='ไม่พบข้อมูล' />

  return (
    <QueryBoundary isLoading={isLoading} isError={isError}>
      {cards.length === 0 ? (
        <Empty description='ไม่พบข้อมูล' />
      ) : (
        <div>
          <CardList data={cards} statusMap={STATUS_MAP} />
          <div className='mt-5 flex justify-end'>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={meta?.total ?? 0}
              onChange={(nextPage, nextPageSize) => {
                setPage(nextPage)
                setPageSize(nextPageSize)
              }}
            />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}

export default React.memo<Props>(OverallDailyWeightList)
